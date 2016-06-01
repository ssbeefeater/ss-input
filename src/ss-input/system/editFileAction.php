<?php
try {
    require_once 'BaseController.php';
    if ($_SERVER['REQUEST_METHOD'] == 'GET') {
        $response = getHandler();
    } else {
        parse_str(file_get_contents("php://input"), $requestData);
        $response = postUpdateHandler($requestData);
    }

    echo json_encode($response);
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

function postUpdateHandler($requestData)
{
    $dirName = dirname($requestData['filePath']);
    $fileName = baseName($requestData['filePath']);


    if (!isset ($requestData['filePath']) || $dirName == '' || $dirName == '/' || $dirName == '\\') {
        throw new Exception($GLOBALS['translation']["invalidDest"]);
    }

    if (!isset ($requestData['fileContent'])) {
        $fileContent = '';
    } else {
        $fileContent = $requestData['fileContent'];
    }
    $ext = pathinfo($fileName, PATHINFO_EXTENSION);
    if ($ext != '' && in_array($ext, $GLOBALS['allowed']) == false) {
        throw new Exception(replaceText($GLOBALS['translation']["extError"], array($ext)));
    }
    $fileName = str_replace(' ', '-', filter_var($fileName, FILTER_SANITIZE_STRING));
    $fullPath = $GLOBALS['maindir'] . $requestData['filePath'];
    if (!file_exists($fullPath)|| $_SERVER['REQUEST_METHOD'] == 'UPDATE') {
        $fp = fopen($fullPath, "wb");
        if (fwrite($fp, $fileContent)) {
            fclose($fp);
            return array(
                'type' => 'success',
                'msg' => $GLOBALS['translation']["fileSuccessCreated"]
            );
        } else {
            $error = error_get_last();
            throw new ErrorException ($error ['message']);
        }
    } else {
        throw new Exception (replaceText($GLOBALS['translation']["already_exists"], array($fileName)));
    }


}

function getHandler()
{
    if (!file_exists($_GET['filePath'])) {
        return array(
            'type' => 'success',
            'msg' => htmlspecialchars(file_get_contents($GLOBALS['maindir'] . $_GET['filePath']), ENT_QUOTES)
        );
    } else {
        throw new Exception(replaceText($GLOBALS['translation']["notExistsError"], array($_GET['filePath'])));
    }
}
