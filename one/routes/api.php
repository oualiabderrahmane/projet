<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MetadataController;
use App\Http\Controllers\CollectePreparationController;
use App\Http\Controllers\ExtractionAltimetriqueController;
use App\Http\Controllers\Digitalisation2DController;
use App\Http\Controllers\CompletementSpatialController;
use App\Http\Controllers\TraitementVecteurController;
use App\Http\Controllers\ControleCartographiqueController;
use App\Http\Controllers\RedactionCartographiqueController;
use App\Http\Controllers\FinalleController;


/*
|--------------------------------------------------------------------------
| AUTH ROUTES
|--------------------------------------------------------------------------
*/

Route::post('/login', [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| PROTECTED ROUTES (Sanctum)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    /*
    |--------------------------------------------------------------------------
    | METADATA ROUTES
    |--------------------------------------------------------------------------
    */

    Route::get('/metadata', [MetadataController::class, 'index']);
    Route::get('/metadata/{id}', [MetadataController::class, 'show']);
    Route::get('/metadata/feuille/{id}', [MetadataController::class, 'byFeuille']);
    Route::get('/metadata/coupure/{id}', [MetadataController::class, 'byCoupure']);

    Route::post('/metadata/full-create', [MetadataController::class, 'store'])
        ->middleware('role:collect');

//    Route::post('/metadata', [MetadataController::class, 'store']);
    Route::put('/metadata/{id}', [MetadataController::class, 'update']);
    Route::delete('/metadata/{id}', [MetadataController::class, 'destroy']);

    /*
    |--------------------------------------------------------------------------
    | COLLECTE PREPARATION ROUTES
    |--------------------------------------------------------------------------
    */
Route::get('/collecte-preparation', [CollectePreparationController::class, 'index']);
Route::post('/collecte-preparation', [CollectePreparationController::class, 'store']);
Route::get('/collecte-preparation/{id}', [CollectePreparationController::class, 'show']);
Route::put('/collecte-preparation/{id}', [CollectePreparationController::class, 'update']);
Route::delete('/collecte-preparation/{id}', [CollectePreparationController::class, 'destroy']);
});

// Extraction Altimetrique routes
Route::resource('extraction-altimetrique', ExtractionAltimetriqueController::class);
//digitalisation 2D routes
Route::resource('digitalisation-2d', Digitalisation2DController::class);
//cmpletment spatial routes
Route::resource('completement-spatial', CompletementSpatialController::class);
//traitment vecteur

Route::resource('traitement-vecteur', TraitementVecteurController::class);
//redaction
Route::resource('redaction-cartographique', RedactionCartographiqueController::class);
//controle cartographique routes
Route::resource('controle-cartographique', ControleCartographiqueController::class);

Route::get('/coupure-fiche/{id}/xml', [FinalleController::class, 'exportXml']);
