<?php
// 診断のフォーム送信を受け取り、メールを送る（ロリポップ等のPHPが使えるレンタルサーバー用。D-064）。
// ・メール受取（form=email）：入力したアドレスへ診断結果を送る。本文は result-copy.json の決まった文言だけで作る
//   （入力された自由な文をメールに載せないため、他人宛ての迷惑メールの踏み台にならない）。
// ・30分相談（form=consult）：事務所へ通知（入力内容＋診断結果）、相談者へは決まった文の自動返信。
// ・対策：POSTのみ・JSONのみ・サイズ上限、送信元ページのホスト確認、人には見えない入力欄（website）、
//   接続元ごとの連続送信制限、入力の長さ・形式の確認、ヘッダーへの改行の混入を防ぐ。
// 応答：{ "ok": true } または { "ok": false, "error": "…" }（HTTPステータスも合わせる）
declare(strict_types=1);

// 警告などが応答（JSON）に混ざらないよう、画面には出さずサーバーのログにだけ残す
ini_set('display_errors', '0');
ini_set('log_errors', '1');
date_default_timezone_set('Asia/Tokyo');

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function respond(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

$config = require __DIR__ . '/config.php';

// 1. リクエストの形
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, ['ok' => false, 'error' => 'method-not-allowed']);
}
if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) {
    respond(415, ['ok' => false, 'error' => 'unsupported-media-type']);
}
$raw = file_get_contents('php://input', false, null, 0, 16385);
if ($raw === false || strlen($raw) > 16384) {
    respond(413, ['ok' => false, 'error' => 'too-large']);
}

// 2. 送信元ページのホスト（同じサイトのフォームからだけ受け付ける）
$hostHeader = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
if (!preg_match('/^[a-z0-9.-]+(:\d+)?$/', $hostHeader)) {
    respond(400, ['ok' => false, 'error' => 'invalid-host']);
}
$host = preg_replace('/:\d+$/', '', $hostHeader);
$allowed = array_map('strtolower', $config['allowed_hosts'] ?: [$host]);
$origin = $_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? '');
$originHost = strtolower((string) parse_url($origin, PHP_URL_HOST));
if ($originHost === '' || !in_array($originHost, $allowed, true)) {
    respond(403, ['ok' => false, 'error' => 'forbidden-origin']);
}

// 3. 設定が済んでいるか（送信元・通知先が空なら送らない）
$from = trim((string) $config['mail_from']);
$notifyTo = trim((string) $config['notify_to']);
if (!filter_var($from, FILTER_VALIDATE_EMAIL) || !filter_var($notifyTo, FILTER_VALIDATE_EMAIL)) {
    respond(503, ['ok' => false, 'error' => 'not-configured']);
}

$data = json_decode($raw, true);
if (!is_array($data)) {
    respond(400, ['ok' => false, 'error' => 'invalid-json']);
}

// 4. ロボット対策：人には見えない入力欄に値があれば、送ったふりをして終える
if (trim((string) ($data['website'] ?? '')) !== '') {
    respond(200, ['ok' => true]);
}

// 5. 連続送信の制限（接続元ごと。data/rate/ に記録）
$dataDir = __DIR__ . '/data';
$rateDir = $dataDir . '/rate';
if (!is_dir($rateDir) && !mkdir($rateDir, 0700, true) && !is_dir($rateDir)) {
    respond(500, ['ok' => false, 'error' => 'storage']);
}
$rateFile = $rateDir . '/' . hash('sha256', $_SERVER['REMOTE_ADDR'] ?? 'unknown') . '.json';
$now = time();
$window = (int) $config['rate_limit']['window'];
$hits = is_file($rateFile) ? (json_decode((string) file_get_contents($rateFile), true) ?: []) : [];
$hits = array_values(array_filter($hits, fn ($t) => is_int($t) && $t > $now - $window));
if (count($hits) >= (int) $config['rate_limit']['max']) {
    respond(429, ['ok' => false, 'error' => 'too-many-requests']);
}

// 6. 入力の確認
$oneLine = fn ($v, int $max) => mb_substr(trim(preg_replace('/[\r\n\t]+/u', ' ', (string) $v)), 0, $max);
$form = $data['form'] ?? '';
if (!in_array($form, ['email', 'consult'], true)) {
    respond(400, ['ok' => false, 'error' => 'invalid-form']);
}
$email = $oneLine($data['email'] ?? '', 254);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(400, ['ok' => false, 'error' => 'invalid-email']);
}
if (($data['consent'] ?? false) !== true) {
    respond(400, ['ok' => false, 'error' => 'consent-required']);
}
$newsletter = ($data['newsletter'] ?? false) === true;
$name = $oneLine($data['name'] ?? '', 100);
$company = $oneLine($data['company'] ?? '', 100);
$message = mb_substr(trim(str_replace("\r", '', (string) ($data['message'] ?? ''))), 0, 2000);
if ($form === 'consult' && $name === '') {
    respond(400, ['ok' => false, 'error' => 'name-required']);
}

// 7. 診断結果（決まった文言だけで本文を作る。IDは result-copy.json にあるものだけ使う）
$copy = json_decode((string) file_get_contents(__DIR__ . '/result-copy.json'), true);
$result = is_array($data['result'] ?? null) ? $data['result'] : null;
$resultText = '';
if ($result !== null) {
    $type = in_array($result['type'] ?? '', ['A', 'B', 'C'], true) ? $result['type'] : null;
    $ids = fn ($list) => array_values(array_unique(array_filter(is_array($list) ? $list : [], fn ($id) => is_string($id) && isset($copy['questions'][$id]))));
    $checks = array_slice($ids($result['checks'] ?? []), 0, 12);
    $ready = array_slice($ids($result['ready'] ?? []), 0, 12);
    if ($type !== null) {
        $r = $copy['results'][$type];
        $no = fn ($id) => $copy['questions'][$id]['no'];
        $lines = ['■ 結果', '【' . $r['chip'] . '】' . str_replace('{n}', (string) count($checks), $r['heading']), ''];
        if ($type === 'A' && $checks) {
            $lines[] = '■ 優先して確認したいこと';
            foreach ($checks as $i => $id) {
                $p = $copy['priority'][$id] ?? null;
                $lines[] = sprintf('%d. %s', $i + 1, $p['title'] ?? str_replace('{no}', $no($id), $copy['unconfirmed']['priorityTitle']));
                $lines[] = '   ' . ($p['body'] ?? $copy['unconfirmed']['priorityBody']);
            }
            $lines[] = '';
        }
        if ($r['next']) {
            $lines[] = '■ ' . $r['next']['title'];
            $lines[] = $r['next']['body'];
            $lines[] = '';
        }
        if ($ready) {
            $lines[] = '■ 準備できていること';
            foreach ($ready as $id) {
                $label = ($type === 'C' ? ($copy['readyPreFounding'][$id] ?? null) : null) ?? $copy['ready'][$id] ?? str_replace('{no}', $no($id), $copy['unconfirmed']['ready']);
                $lines[] = '・' . $label;
            }
            $lines[] = '';
        }
        $lines[] = '※' . $copy['disclaimer'];
        $resultText = implode("\n", $lines);
    }
}
if ($form === 'email' && $resultText === '') {
    respond(400, ['ok' => false, 'error' => 'result-required']);
}

// 8. メール送信（ロリポップのPHP mail関数。日本語は mb_send_mail で ISO-2022-JP / Base64 に変換）
mb_language('Japanese');
mb_internal_encoding('UTF-8');

$siteBase = preg_replace('#/api/send\.php$#', '/', (string) parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH));
// メール内のURLは、設定したホスト（allowed_hosts の先頭）を優先する
$siteUrl = 'https://' . ($config['allowed_hosts'][0] ?? $hostHeader) . $siteBase;
$consultUrl = $config['consult_url'] ?: $siteUrl . 'diagnosis/#consult';
$fromName = $oneLine($config['mail_from_name'], 60);
$signature = implode("\n", [
    '──────────────────',
    $fromName,
    'https://ascend-tax.jp/',
    '※このメールは送信専用のアドレスからお送りしています。',
]);

function send_mail(array $config, string $to, string $subject, string $body, string $from, string $fromName, ?string $replyTo = null): bool
{
    $headers = ['From: ' . mb_encode_mimeheader($fromName) . ' <' . $from . '>'];
    if ($replyTo !== null) {
        $headers[] = 'Reply-To: ' . $replyTo;
    }
    if ($config['dry_run']) {
        $dir = __DIR__ . '/data/outbox';
        if (!is_dir($dir)) {
            mkdir($dir, 0700, true);
        }
        $file = $dir . '/' . date('Ymd-His') . '-' . bin2hex(random_bytes(3)) . '.txt';
        return file_put_contents($file, "To: {$to}\n" . implode("\n", $headers) . "\nSubject: {$subject}\n\n{$body}\n") !== false;
    }
    $params = $config['use_envelope_from'] ? '-f' . $from : '';
    return mb_send_mail($to, $subject, $body, implode("\r\n", $headers), $params);
}

$sent = true;
$stamp = date('Y-m-d H:i');
if ($form === 'email') {
    $body = implode("\n", [
        'STARTUP TAX CHECK をご利用いただき、ありがとうございます。',
        '診断結果をお送りします。',
        '',
        $resultText,
        '',
        '結果をもとに、税理士と次の一歩を。',
        '30分無料相談で、気になる項目と確認の進め方を整理できます（ご希望の方のみ）。',
        $consultUrl,
        '',
        $signature,
    ]);
    $sent = send_mail($config, $email, '【STARTUP TAX CHECK】診断結果をお送りします', $body, $from, $fromName);
    if ($sent && ($newsletter || $config['notify_on_email_form'])) {
        $sent = send_mail($config, $notifyTo, '【STARTUP TAX CHECK】診断結果のメール受取がありました', implode("\n", [
            "受信日時：{$stamp}",
            "メールアドレス：{$email}",
            '税務・会計のお役立ち情報：' . ($newsletter ? '希望する' : '希望しない'),
            '',
            $resultText,
        ]), $from, $fromName, $email);
    }
} else {
    $sent = send_mail($config, $notifyTo, "【30分無料相談】{$name} 様よりご希望が届きました", implode("\n", [
        "受信日時：{$stamp}",
        "お名前：{$name}",
        '会社名：' . ($company !== '' ? $company : '（未入力）'),
        "メールアドレス：{$email}",
        '税務・会計のお役立ち情報：' . ($newsletter ? '希望する' : '希望しない'),
        '',
        '■ 相談したいこと',
        $message !== '' ? $message : '（未入力）',
        '',
        $resultText !== '' ? $resultText : '■ 診断結果：なし（診断を受けずに相談）',
        '',
        '※このメールに返信すると、相談者のメールアドレス宛てになります。',
    ]), $from, $fromName, $email);
    if ($sent) {
        // 相談者への自動返信は決まった文だけ（入力された文は載せない）
        $sent = send_mail($config, $email, '【STARTUP TAX CHECK】30分無料相談のご希望を受け付けました', implode("\n", [
            '30分無料相談のご希望を受け付けました。ありがとうございます。',
            'ご入力のメールアドレス宛に、日程調整のご案内をお送りします。',
            'この時点では予約は確定していません。',
            '',
            $signature,
        ]), $from, $fromName);
    }
}

if (!$sent) {
    respond(500, ['ok' => false, 'error' => 'send-failed']);
}
$hits[] = $now;
// 一時ファイルに書いてから置き換える（書きかけのファイルを読まないため。ファイルロックに頼らない）
$tmp = $rateFile . '.' . bin2hex(random_bytes(4)) . '.tmp';
if (file_put_contents($tmp, json_encode($hits)) !== false) {
    rename($tmp, $rateFile);
}
respond(200, ['ok' => true]);
