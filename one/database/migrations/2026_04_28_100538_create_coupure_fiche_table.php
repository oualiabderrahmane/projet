<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('coupure_fiche', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('coupure_id')->unique('coupure_fiche_coupure_id_key');
            $table->bigInteger('feuille_id');
            $table->bigInteger('metadata_id')->nullable();
            $table->bigInteger('collecte_preparation_id')->nullable();
            $table->bigInteger('extraction_altimetrique_id')->nullable();
            $table->bigInteger('digitalisation_2d_id')->nullable();
            $table->bigInteger('completement_spatial_id')->nullable();
            $table->bigInteger('traitement_vecteur_id')->nullable();
            $table->bigInteger('redaction_cartographique_id')->nullable();
            $table->bigInteger('controle_cartographique_id')->nullable();
            $table->bigInteger('validation_export_id')->nullable();
            $table->integer('etape_courante')->nullable()->default(1);
            $table->string('statut', 20)->nullable()->default('en_cours');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coupure_fiche');
    }
};
