<?php
try {
    require_once 'BaseController.php';

    $rootPath = $_POST ['rootPath'];
    if (!isset ($rootPath) || $rootPath == '' || $rootPath == '/' || $rootPath == '\\') {
        throw new Exception($translation["invalidDest"]);
    }
    echo json_encode(array(
        'type' => 'success',
        'msg' => scanFolder($maindir . $rootPath)
    ));
} catch (ErrorException $err) {
    echo json_encode(array(
        'type' => 'cons',
        'msg' => $err->getMessage()
    ));

} catch (Exception $e) {
    echo json_encode(array(
        'type' => 'error',
        'msg' => $e->getMessage()
    ));
}
function scanFolder($dir)
{
    $files = scandir($dir);
    $url = str_replace($GLOBALS['maindir'], '', $dir);
    $resultArray = array();
    foreach ($files as $name) {
        if (is_dir($dir . '/' . $name) && $name != '.' && $name != '..') {
            $fullPath = $url . '/' . $name;
            $fullPath = str_replace('//', '/', $fullPath);
            array_push($resultArray, array(
                'name' => $name,
                'url' => $fullPath,
                'children' => scanFolder($dir . '/' . $name)
            ));
        }
    }
    return $resultArray;
}