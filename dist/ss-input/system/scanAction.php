<?php
try {
    require_once 'BaseController.php';
    $dir = $_GET['currentDir'];
    if (!isset($dir) || $dir == '' || $dir == '/' || $dir == '\\') {
        throw new Exception($translation["invalidSource"]);
    }

    $dir = $maindir . '/' . $dir;
    $files = scandir($dir);
    $files = array_diff($files, array(
        '.',
        '..'
    ));
    if (!file_exists($dir)) {
        throw new Exception(replaceText($translation["notExistsError"], $_GET['currentDir']));
    }
    $details = array();
    foreach ($files as $fileName) {
        $type = fileExtension($fileName);
        $filePath = $dir . '/' . $fileName;
        $mimeType = mime_content_type($filePath);
        if (in_array(strtolower($type), $allowed) || is_dir($filePath)) {

            $date = date("d/m/Y G:i a", filectime($filePath));
            $path = str_replace('//', '/', str_replace($GLOBALS['maindir'], '', $filePath));
            if (is_dir($filePath)) {
                $type = 'zzzzfolder';
                $size = 0; //for folder size run this (not recommended):round(folderSize($filePath) / 1024, 2)
                $width = '';
                $height = '';
            } else {
                $fileType = explode("/", $mimeType);
                if (array_shift($fileType) == 'image') {
                    list($width, $height) = getimagesize($filePath);
                } else {
                    $width = '';
                    $height = '';
                }
                $size = filesize($filePath);
            }

            $fileInfo = array(
                'name' => $fileName,
                'mimeType' => $mimeType,
                'date' => $date,
                'path' => $path,
                'size' => size($size),
                'ext' => $type,
                'dimensions' => $width . 'x' . $height,
            );
            array_push($details, $fileInfo);
        }
    }
    echo json_encode(array(
        'type' => 'success',
        'msg' => $details
    ));
} catch (Exception $e) {
    echo json_encode(array(
        'type' => 'error',
        'msg' => $e->getMessage()
    ));
}
function fileExtension($file)
{
    return pathinfo($file, PATHINFO_EXTENSION);
}

//@author http://stackoverflow.com/a/5502088/4801797
function size($bytes)
{
    if ($bytes > 0) {
        $unit = intval(log($bytes, 1024));
        $units = array('B', 'KB', 'MB', 'GB');

        if (array_key_exists($unit, $units) === true) {
            return sprintf('%d %s', $bytes / pow(1024, $unit), $units[$unit]);
        }
    }

    return $bytes;
}

function folderSize($dir)
{
    $size = 0;
    foreach (glob(rtrim($dir, '/') . '/*', GLOB_NOSORT) as $each) {
        $size += is_file($each) ? filesize($each) : folderSize($each);
    }
    return $size;
}
