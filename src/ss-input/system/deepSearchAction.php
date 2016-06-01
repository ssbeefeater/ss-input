<?php
try {
    require_once 'BaseController.php';
    $keyword = $_GET ['keyword'];
    $rootPath = $_GET ['rootPath'];
    if (!isset ($rootPath) || $rootPath == '' || $rootPath == '/' || $rootPath == '\\') {
        throw new ErrorException("Invalid File Destination");
    }
    if (!isset ($keyword) || $keyword == '' || $keyword == '/' || $keyword == '\\') {
        throw new ErrorException("Nothing to Search");
    }

    $keyword = filter_var($keyword, FILTER_SANITIZE_STRING);
    $dirPath = $maindir . $rootPath;
    $res = array();
    deepSearch($dirPath, $keyword);
    echo json_encode(array(
        'type' => 'success',
        'msg' => $res
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

function deepSearch($dir, $keyword)
{
    $ffs = scandir($dir);
    $ffs = array_diff($ffs, array(
        '.',
        '..'
    ));
    foreach ($ffs as $ff) {
        $file = $dir . '/' . $ff;
        if (is_dir($file)) {
            if (substr($dir, strlen($dir) - 1, 1) != '/') {
                $dir .= '/';
            }
            deepSearch($dir . $ff, $keyword);
        } else {
            $type = pathinfo($file, PATHINFO_EXTENSION);
            if (in_array(strtolower($type), $GLOBALS['allowed'])) {
                $regkeyword = preg_quote($keyword, '/');
                if (preg_match("/$regkeyword/i", $ff)) {
                    $path = $dir;
                    if (substr($path, strlen($path) - 1, 1) != '/') {
                        $path .= '/';
                    }
                    $path = str_replace($GLOBALS['maindir'], '', $path . $ff);
                    $name = $ff;
                    $date = date("l, d F  Y", filectime($file));
                    list($width, $height) = getimagesize($file);
                    $size = round(filesize($file) / 1024, 2);
                    $a = array(
                        'name' => $name,
                        'mimeType' => mime_content_type($file),
                        'date' => $date,
                        'path' => $path,
                        'size' => $size,
                        'ext' => $type,
                        'dimensions' => $width . 'x' . $height,
                    );

                    array_push($GLOBALS['res'], $a);
                }
            }
        }
    }

}