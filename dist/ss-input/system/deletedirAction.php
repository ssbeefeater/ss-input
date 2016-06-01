<?php
try {
    require_once 'BaseController.php';
    parse_str(file_get_contents("php://input"), $requestData);
    $path = $requestData['id'];
    if (!isset ($path) || $path == '' || $path == '/' || $path == '\\') {
        throw new Exception($translation['invalidDest']);
    }

    $errors = array();
    if (is_array($path)) {
        foreach ($path as $file)
            deleteFile($maindir . $file);
    } else {
        deleteFile($maindir . $path);
    }

    echo json_encode(array(
        'type' => 'success',
        'msg' => $errors
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
function deleteFile($filePath)
{

    if (file_exists($filePath)) {
        if (is_dir($filePath)) {
            if (substr($filePath, strlen($filePath) - 1, 1) != '/') {
                $filePath .= '/';
            }
            $files = glob($filePath . '*', GLOB_MARK);
            foreach ($files as $file) {
                if (is_dir($file)) {
                    deleteFile($file);
                } else {
                    if (!unlink($file)) {
                        $error = error_get_last();
                        array_push($GLOBALS["errors"], array("url" => str_replace($GLOBALS['maindir'], '', rtrim($filePath, "/")), "msg" => $error ['message']));
                        continue;
                    }
                }
            }
            if (!rmdir($filePath)) {
                $error = error_get_last();
                array_push($GLOBALS["errors"], array("url" => str_replace($GLOBALS['maindir'], '', rtrim($filePath, "/")), "msg" => $error ['message']));
            }
        } else {
            if (!unlink($filePath)) {
                $error = error_get_last();
                array_push($GLOBALS["errors"], array("url" => str_replace($GLOBALS['maindir'], '', rtrim($filePath, "/")), "msg" => $error ['message']));
            }
        }
    } else {
        array_push($GLOBALS["errors"], array("url" => str_replace($GLOBALS['maindir'], '', rtrim($filePath, "/")), "msg" => replaceText($GLOBALS['translation']['notExistsError'], array($filePath))));
    }

}