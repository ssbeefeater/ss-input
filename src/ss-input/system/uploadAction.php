<?php
try {
    require_once 'BaseController.php';
    $dir = $_POST ['currentDir'];
    if (!isset ($dir) || $dir=='' || $dir=='/'|| $dir=='\\') {
        throw new Exception($translation["invalidDest"]);
    }
    $path = $maindir . $dir;
    if(!file_exists($path)){
        throw new Exception($translation["destFolderError"]);
    }
    foreach ($_FILES ['files'] ['name'] as $pos => $name) {
        $ext = pathinfo($name, PATHINFO_EXTENSION);
        if (substr($path, strlen($path) - 1, 1) != '/') {
            $path .= '/';
        }
        $path .= str_replace(' ','-',$name);
        throw new Exception('Exist');

        if (file_exists($path)) {
            throw new Exception('Exist');
        } else {
            if (!move_uploaded_file($_FILES ['files'] ['tmp_name'][$pos], $path)) {
                $errors = error_get_last();
                throw new ErrorException($errors ['message']);
            }
            touch($path,time());
        }
    }
    echo json_encode(array(
        'type' => 'success',
        'msg' => $translation["success"]
    ));
}catch(ErrorException $err){
    echo json_encode(array(
        'type' => 'cons',
        'msg' => $err->getMessage()
    ));
}catch (Exception $e) {
    echo json_encode(array(
        'type' => 'error',
        'msg' => $e->getMessage()
    ));
}