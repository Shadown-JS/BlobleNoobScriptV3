<?php

header("Access-Control-Allow-Origin: *");
 
include "SuperSQL.php";

function rc4($key, $str) {
	$s = array();
	for ($i = 0; $i < 256; $i++) {
		$s[$i] = $i;
	}
	$j = 0;
	for ($i = 0; $i < 256; $i++) {
		$j = ($j + $s[$i] + ord($key[$i % strlen($key)])) % 256;
		$x = $s[$i];
		$s[$i] = $s[$j];
		$s[$j] = $x;
	}
	$i = 0;
	$j = 0;
	$res = '';
	for ($y = 0; $y < strlen($str); $y++) {
		$i = ($i + 1) % 256;
		$j = ($j + $s[$i]) % 256;
		$x = $s[$i];
		$s[$i] = $s[$j];
		$s[$j] = $x;
		$res .= $str[$y] ^ chr($s[($s[$i] + $s[$j]) % 256]);
	}
	return $res;
}

if (isset($_GET['id']) && strlen($_GET['id']) >= 10 && strlen($_GET['id']) <= 30) {
    $db = new SuperSQL\SQLHelper('localhost','<censored>','<censored>','<censored>');
    
    $dt = $db->select('registered',['*'],[
    'id'=> (string)$_GET['id']
    ])[0];
    if ($dt) {
        if ($dt['active'] == 1) {
            $db->update('registered',[
                '[+=]count'=>1
                ],[
                    'id'=> (string)$_GET['id']   
                    ]);
                    echo base64_encode(rc4('<censored>',json_encode($dt)));
        } else echo base64_encode(rc4('<censored>','{"error":"Deactivated account"}'));
    } else {
        $dt = [
            'id'=>(string)$_GET['id'],
            'time'=>floor(time()/60),
            'msg'=>'Hello guest!'
        ];
    
        $db->insert('registered',$dt);
     echo base64_encode(rc4('<censored>',json_encode($dt)));  
    }
}
?>
