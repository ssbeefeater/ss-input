<?php
error_reporting(false);
ini_set('display_errors', false);
try {
    require_once 'BaseController.php';
    $oldUrl = $_POST ['oldUrl'];
    $newUrl = $_POST ['newUrl'];
    if(isset($_POST ['replace'])){
        $replace = $_POST ['replace'];
    }else{
        $replace = false;
    }
    if ($replace!=true && $replace!=false && $replace!='continue') {
        $replace = false;
    }

    if($oldUrl==$newUrl){
        echo json_encode(array(
            'type' => 'success',
            'msg' => 'success'
        ));
        return;
    }
    if (!isset ($oldUrl) || $oldUrl == '' || $oldUrl == '/' || $oldUrl == '\\') {
        throw new Exception($translation["invalidSource"]);
    }
    if (!isset ($newUrl) || $newUrl == '' || $newUrl == '/' || $newUrl == '\\') {
        throw new Exception($translation["invalidDest"]);
    }
    $ext = pathinfo($newUrl, PATHINFO_EXTENSION);
    $name = basename($newUrl);
    $newFullPath = $maindir . $newUrl;
    $oldFullPath = preg_replace('/\/+/', '/', $maindir . $oldUrl);
    if (!file_exists($oldFullPath) ) {
        throw new Exception($translation["destError"]);
    }

    //    check if destination folder is inside it self
    $regOldPath=preg_quote($oldFullPath, '/');
    $oldSegments = count(explode('/', $oldFullPath));
    $newSegments = count(explode('/', $newFullPath));
    $dirnameSegments =count(explode('/', dirname($newFullPath)));
    if ((dirname($newFullPath) == $oldFullPath) || (preg_match("/^$regOldPath/",$newFullPath) && (preg_replace('/-copy\(*\d*\)*/','',basename($oldFullPath))==preg_replace('/-copy\(*\d*\)*/','',basename($newFullPath))&& $dirnameSegments!==$oldSegments ) && $oldSegments!==$newSegments)) {
        throw new Exception($translation["in_itselfError"]);
    }
    $regNewPAth=preg_quote($newFullPath, '/');
    if (preg_match("/^$regNewPAth/",$oldFullPath) && $replace == 'true') {
        throw new Exception($translation["replaceError"]);
    }
    if ($newFullPath != $oldFullPath) {
        cutAction($oldFullPath, $newFullPath, $replace);
        if (is_dir($oldFullPath)) {
            rrmdir($oldFullPath);
        }
    }
    echo json_encode(array(
        'type' => 'success',
        'msg' => 'successfull'
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
function rrmdir($dir)
{
    if (is_dir($dir)) {
        $files = scandir($dir);
        foreach ($files as $file)
            if ($file != "." && $file != "..") rrmdir("$dir/$file");
        if (!rmdir($dir)) {
            $error = error_get_last();
            throw new ErrorException ($error ['message']);
        };
    } else if (file_exists($dir))
        if (!unlink($dir)) {
            $error = error_get_last();
            throw new ErrorException ($error ['message']);
        };
}

function cutAction($src, $dst, $rep)
{
    if (file_exists($dst)) {
        if ($rep == false) {
            throw new Exception(basename($dst) . ' already_exists');
        }else if ($rep == true) {
            rrmdir ( $dst );
        }
    }
    if (is_dir($src)) {
        if (!mkdir($dst)) {
            $error = error_get_last();
            throw new ErrorException ($error ['message']);
        };
        $files = scandir($src);
        foreach ($files as $file)
            if ($file != "." && $file != "..")
                cutAction("$src/$file", "$dst/$file", $rep);
    } else if (file_exists($src))
        if (!rename($src, $dst)) {
            $error = error_get_last();
            throw new ErrorException ($error ['message']);
        };
}