<?php
try {
    require_once 'BaseController.php';
    $dirname = $_POST ['dirname'];
    $dir = $_POST ['currentDir'];

    if (!isset ($dir) || $dir=='' || $dir=='/'|| $dir=='\\') {
        throw new Exception($translation["invalidDest"]);
    }
    if (!isset ($dirname) || $dirname=='' || $dirname=='/'|| $dirname=='\\') {
        throw new Exception($translation["invalidName"]);
    }
    $dirname=filter_var($dirname, FILTER_SANITIZE_STRING);
    $path = $maindir . $dir;
    if (substr($path, strlen($path) - 1, 1) != '/') {
        $path .= '/';
    }
    $path .= $dirname;
    if (!file_exists($path)) {
        $old_umask = umask(0);
        if (mkdir($path, 0777, true)) {
            umask($old_umask);
            echo json_encode(array(
                'type' => 'success',
                'msg' => $translation["successCreated"]
            ));
        } else {
            $error = error_get_last();
            throw new ErrorException ($error ['message']);
        }
    } else {
        throw new Exception (replaceText($translation["already_exists"],array($dirname)));
    }
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