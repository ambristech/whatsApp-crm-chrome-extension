<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$host = 'localhost';
$dbname = 'whatsapp_sender';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $stmt = $pdo->query("SELECT name, company, phone FROM contacts WHERE phone IS NOT NULL");
    $contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $formattedContacts = array_map(function($contact) {
        return [
            'name' => $contact['name'],
            'company_name' => $contact['company'] ?? '',
            'phone_number' => $contact['phone']
        ];
    }, $contacts);
    
    echo json_encode([
        'status' => 'success',
        'data' => $formattedContacts
    ]);
} catch(PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?> 