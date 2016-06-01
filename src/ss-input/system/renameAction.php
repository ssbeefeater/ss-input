<?php
try {
    require_once 'BaseController.php';
    $oldUrl = $_POST ['oldUrl'];
    $newUrl = $_POST ['newUrl'];
    if (!isset ($oldUrl) || $oldUrl == '' || $oldUrl == '/' || $oldUrl == '\\') {
        throw new Exception($translation["invalidSource"]);
    }
    if (!isset ($newUrl) || $newUrl == '' || $newUrl == '/' || $newUrl == '\\') {
        throw new Exception($translation["invalidDest"]);
    }

    $newUrl = filter_var($newUrl, FILTER_SANITIZE_STRING);

    $ext = pathinfo($newUrl, PATHINFO_EXTENSION);
    $name = basename($newUrl);
    $newFullPath = $maindir . $newUrl;
    $files = scandir(dirname($newFullPath));
    if (in_array($name, $files)) {
        throw new Exception(replaceText($translation["already_exists"], array($name)));
    }
    if (!file_exists($maindir . $oldUrl)) {
        throw new Exception(replaceText($translation["notExistsError"], array($oldUrl)));
    }

    if (!is_dir($maindir . $oldUrl)) {
        if ($ext != '' && in_array($ext, $allowed) == false) {
            throw new Exception(replaceText($translation["extError"], array($ext)));
        }
    }

    if (!rename($maindir . $oldUrl, $newFullPath)) {
        $error = error_get_last();
        throw new ErrorException($error ['message']);
    } else {
        echo json_encode(array(
            'type' => 'success',
            'msg' => $translation["success"]
        ));
    }

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