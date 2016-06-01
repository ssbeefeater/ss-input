<?php
error_reporting(false);
ini_set('display_errors', false);
/*******************************************************************************/
    /*****************************CONFIGURATION*************************************/
    /*******************************************************************************/

    $language = 'en'; //browser language: substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2);
    $allowed = array("jpg", "png", "jpeg","txt","js");
    $maxUploadSize = 2;

    /*******************************************************************************/
    /*****************************\CONFIGURATION************************************/
    /*******************************************************************************/

    require 'language/' . $language . '.php';
    if (!isset($maindir)) {
        $maindir = $_SERVER ['DOCUMENT_ROOT'];
        if (!file_exists($maindir)) {
            $baseuri = dirname(__FILE__);
            $baseuri = substr($baseuri, 0, strpos($baseuri, $_SERVER ['SERVER_NAME']));
            $baseuri = $baseuri . $_SERVER ['SERVER_NAME'];
            $maindir = $baseuri;
            if (!file_exists($baseuri)) {
                throw new Exception('destination folder not found');
            }
        }
    }

function replaceText($str, $args)
{
    $i = 1;

    foreach ($args as $arg) {
        $str = preg_replace("/\\$$i/", $arg, $str);
        $i++;
    }
    return $str;
}
