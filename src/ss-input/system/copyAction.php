<?php
try {
    require_once 'BaseController.php';
    $oldUrl = $_POST ['oldUrl'];
    $newUrl = $_POST ['newUrl'];

    if (isset($_POST ['action'])) {
        $action = $_POST ['action'];
    } else {
        $action = false;
    }
    if ($action != true && $action != false && $action != 'continue') {
        $action = false;
    }
    if (!isset ($oldUrl) || $oldUrl == '' || $oldUrl == '/' || $oldUrl == '\\') {
        throw new Exception($translation["invalidSource"]);
    }
    if (!isset ($newUrl) || $newUrl == '' || $newUrl == '/' || $newUrl == '\\') {
        throw new Exception($translation["invalidDest"]);
    }
    $ext = pathinfo($newUrl, PATHINFO_EXTENSION);
    $newUrl = preg_replace('/^(([0-9a-zA-Z]+)(-copy|-copy\(\d+\)){0,1}(.{0,1}[a-zA-Z]{0,5}))$/', '$2', $newUrl);
    $newFullPath = $maindir . $newUrl;
    $newName = basename($newUrl);
    $pureName = str_replace('.' . $ext, '', $newName);
    $oldFullPath = preg_replace('/\/+/', '/', $maindir . $oldUrl);
    $oldName = str_replace('.' . $ext, '', basename($oldFullPath));
    if (!file_exists($oldFullPath)) {
        throw new Exception($oldFullPath . ' ' . $translation["destError"]);
    }
//    check if destination folder is inside it self
    $regOldPath = preg_quote($oldFullPath, '/');
    $oldSegments = count(explode('/', $oldFullPath));
    $newSegments = count(explode('/', $newFullPath));
    $dirnameSegments = count(explode('/', dirname($newFullPath)));
    if ((dirname($newFullPath) == $oldFullPath) || (preg_match("/^$regOldPath/", $newFullPath) && (preg_replace('/-copy\(*\d*\)*/', '', basename($oldFullPath)) == preg_replace('/-copy\(*\d*\)*/', '', basename($newFullPath)) && $dirnameSegments !== $oldSegments) && $oldSegments !== $newSegments)) {
        throw new Exception($translation["in_itselfError"]);
    }
    $regNewPath = preg_quote($newFullPath, '/');
    if (($oldFullPath == $newFullPath || (preg_match("/^$regNewPath/", $oldFullPath))) && $action == 'true') {
        throw new Exception($translation["replaceError"]);
    }
    if ($action == 'continue' && file_exists($newFullPath)) {
        $isDir = 0;
        if (is_dir($oldFullPath)) {
            $newPathExt = '';
            $pureNewName = $newFullPath;
            $isDir = 1;
        } else {
            $newPathExt = '.' . pathinfo($newFullPath, PATHINFO_EXTENSION);
            $pureNewName = str_replace($newPathExt, '', $newFullPath);
        }
        if (file_exists($pureNewName . '-copy' . $newPathExt)) {
            if ($isDir == 1) {
                for ($i = 1; $i < 100; $i++) {
                    $newUrl = $newFullPath . '-copy(' . $i . ')';
                    if (!file_exists($newUrl)) {
                        $newFullPath = $newUrl;
                        break;
                    }
                }
            } else {
                for ($i = 1; $i < 100; $i++) {
                    $newUrl = preg_replace('/(.[a-zA-Z]{1,5})$/', '-copy(' . $i . ')$1', $newFullPath);
                    if (!file_exists($newUrl)) {
                        $newFullPath = $newUrl;
                        break;
                    }
                }
            }
        } else {
            $newFullPath = $pureNewName . '-copy' . $newPathExt;
        }

    }

    rcopy($oldFullPath, $newFullPath, $action);
    if ($action == 'continue')
        echo json_encode(array(
            'type' => 'success',
            'msg' => basename($newFullPath) . ' ' . 'continue'
        ));
    else
        echo json_encode(array(
            'type' => 'success',
            'msg' => 'successfull copy'
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

function rcopy($src, $dst, $rep)
{
    if (file_exists($dst)) {
        if ($rep == false) {
            throw new Exception(basename($dst) . ' already_exists');
        } else if ($rep == true) {
            rrmdir($dst);
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
                rcopy("$src/$file", "$dst/$file", $rep);
    } else if (file_exists($src))
        if (!copy($src, $dst)) {
            $error = error_get_last();
            throw new ErrorException ($error ['message'].' '.$src.' '.$dst);
        };
}