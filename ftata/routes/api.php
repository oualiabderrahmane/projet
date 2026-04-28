<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MetadataController;
 use App\Http\Controllers\CollectePreparationController;
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

    Route::post('/metadata/full-create', [MetadataController::class, 'store']);


Route::get('/collecte-preparation', [CollectePreparationController::class, 'index']);
Route::post('/collecte-preparation', [CollectePreparationController::class, 'store']);
Route::get('/collecte-preparation/{id}', [CollectePreparationController::class, 'show']);
Route::put('/collecte-preparation/{id}', [CollectePreparationController::class, 'update']);
Route::delete('/collecte-preparation/{id}', [CollectePreparationController::class, 'destroy']);
});
