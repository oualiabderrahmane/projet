<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CollectePreparationController;
use App\Http\Controllers\CompletementSpatialController;
use App\Http\Controllers\ControleCartographiqueController;
use App\Http\Controllers\Digitalisation2DController;
use App\Http\Controllers\ExtractionAltimetriqueController;
use App\Http\Controllers\FinalleController;
use App\Http\Controllers\MetadataController;
use App\Http\Controllers\RedactionCartographiqueController;
use App\Http\Controllers\TraitementVecteurController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ValidationExportController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [AuthController::class, 'redirectAuthenticated'])->name('home');

Route::get('/p', function () {
    return Inertia::render('Users/Login');
})->name('login');

Route::get('/login', function () {
    return redirect()->route('login');
});

Route::post('/login', [AuthController::class, 'login'])->name('login.store');
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth')->name('logout');

Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/dashboard', fn () => redirect()->route('admin.dashboard'))
        ->name('dashboard');

    Route::get('/admin/dashboard', [UserController::class, 'dashboard'])
        ->name('admin.dashboard');

    Route::get('/users', [UserController::class, 'index'])->name('admin.users');
    Route::put('/users/{user}/password', [UserController::class, 'updatePassword'])
        ->name('admin.users.password');
});

Route::middleware(['auth', 'role:collect'])->group(function () {
    Route::get('/collect', fn () => Inertia::render('Collect/HomeCollect'))
        ->name('collect.home');

    Route::get('/collect/metadata', [MetadataController::class, 'home'])
        ->name('metadata.home');
    Route::post('/collect/metadata', [MetadataController::class, 'store'])
        ->name('metadata.store');
    Route::put('/collect/metadata/{metadata}', [MetadataController::class, 'update'])
        ->name('metadata.update');

    Route::get('/collect/preparation', [CollectePreparationController::class, 'home'])
        ->name('collecte-preparation.home');
    Route::post('/collect/preparation', [CollectePreparationController::class, 'store'])
        ->name('collecte-preparation.store');
    Route::put('/collect/preparation/{preparation}', [CollectePreparationController::class, 'update'])
        ->name('collecte-preparation.update');
});

Route::middleware(['auth', 'role:extraction'])->group(function () {
    Route::get('/extraction', [ExtractionAltimetriqueController::class, 'home'])
        ->name('extraction.home');
    Route::post('/extraction', [ExtractionAltimetriqueController::class, 'store'])
        ->name('extraction.store');
    Route::put('/extraction/{extraction}', [ExtractionAltimetriqueController::class, 'update'])
        ->name('extraction.update');
});

Route::middleware(['auth', 'role:digitalisation'])->group(function () {
    Route::get('/digitalisation', [Digitalisation2DController::class, 'home'])
        ->name('digitalisation.home');
    Route::post('/digitalisation', [Digitalisation2DController::class, 'store'])
        ->name('digitalisation.store');
    Route::put('/digitalisation/{digitalisation}', [Digitalisation2DController::class, 'update'])
        ->name('digitalisation.update');
});

Route::middleware(['auth', 'role:completment_spatial'])->group(function () {
    Route::get('/completment-spatial', [CompletementSpatialController::class, 'home'])
        ->name('completment-spatial.home');

    Route::get('/completment-spatial/create', [CompletementSpatialController::class, 'create'])
        ->name('completment-spatial.create');
    Route::post('/completment-spatial', [CompletementSpatialController::class, 'store'])
        ->name('completment-spatial.store');
    Route::put('/completment-spatial/{id}', [CompletementSpatialController::class, 'update'])
        ->name('completment-spatial.update');
});

Route::middleware(['auth', 'role:traitment_vecteur'])->group(function () {
    Route::get('/traitement-vecteur', [TraitementVecteurController::class, 'home'])
        ->name('traitement-vecteur.home');
    Route::get('/traitement-vecteur/create', [TraitementVecteurController::class, 'create'])
        ->name('traitement-vecteur.create');
    Route::post('/traitement-vecteur', [TraitementVecteurController::class, 'store'])
        ->name('traitement-vecteur.store');
    Route::put('/traitement-vecteur/{traitement}', [TraitementVecteurController::class, 'update'])
        ->name('traitement-vecteur.update');
});

Route::middleware(['auth', 'role:redaction'])->group(function () {
    Route::get('/redaction', fn () => Inertia::render('Redaction/HomeRedaction'))
        ->name('redaction.home');

    Route::get('/redaction-cartographique', [RedactionCartographiqueController::class, 'home'])
        ->name('redaction-cartographique.home');
    Route::get('/redaction-cartographique/create', [RedactionCartographiqueController::class, 'create'])
        ->name('redaction-cartographique.create');
    Route::post('/redaction-cartographique', [RedactionCartographiqueController::class, 'store'])
        ->name('redaction-cartographique.store');
    Route::put('/redaction-cartographique/{id}', [RedactionCartographiqueController::class, 'update'])
        ->name('redaction-cartographique.update');

    Route::get('/controle-cartographique/create', [ControleCartographiqueController::class, 'create'])
        ->name('controle-cartographique.create');
    Route::post('/controle-cartographique', [ControleCartographiqueController::class, 'store'])
        ->name('controle-cartographique.store');

    Route::get('/validation-export/create', [ValidationExportController::class, 'create'])
        ->name('validation-export.create');
    Route::post('/validation-export/download', [ValidationExportController::class, 'download'])
        ->name('validation-export.download');

    Route::get('/coupure-fiche/{id}/xml', [FinalleController::class, 'exportXml'])
        ->name('coupure-fiche.xml');
});
