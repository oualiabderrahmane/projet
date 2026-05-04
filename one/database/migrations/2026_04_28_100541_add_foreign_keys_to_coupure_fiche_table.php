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
        Schema::table('coupure_fiche', function (Blueprint $table) {
            $table->foreign(['collecte_preparation_id'], 'coupure_fiche_collecte_preparation_id_fkey')->references(['id'])->on('collecte_preparation')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['completement_spatial_id'], 'coupure_fiche_completement_spatial_id_fkey')->references(['id'])->on('completement_spatial')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['controle_cartographique_id'], 'coupure_fiche_controle_cartographique_id_fkey')->references(['id'])->on('controle_cartographique')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['coupure_id'], 'coupure_fiche_coupure_id_fkey')->references(['id'])->on('coupures')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['digitalisation_2d_id'], 'coupure_fiche_digitalisation_2d_id_fkey')->references(['id'])->on('digitalisation_2d')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['extraction_altimetrique_id'], 'coupure_fiche_extraction_altimetrique_id_fkey')->references(['id'])->on('extraction_altimetrique')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['feuille_id'], 'coupure_fiche_feuille_id_fkey')->references(['id'])->on('feuilles')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['metadata_id'], 'coupure_fiche_metadata_id_fkey')->references(['id'])->on('metadata')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['redaction_cartographique_id'], 'coupure_fiche_redaction_cartographique_id_fkey')->references(['id'])->on('redaction_cartographique')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['traitement_vecteur_id'], 'coupure_fiche_traitement_vecteur_id_fkey')->references(['id'])->on('traitement_vecteur')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['validation_export_id'], 'coupure_fiche_validation_export_id_fkey')->references(['id'])->on('validation_export')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('coupure_fiche', function (Blueprint $table) {
            $table->dropForeign('coupure_fiche_collecte_preparation_id_fkey');
            $table->dropForeign('coupure_fiche_completement_spatial_id_fkey');
            $table->dropForeign('coupure_fiche_controle_cartographique_id_fkey');
            $table->dropForeign('coupure_fiche_coupure_id_fkey');
            $table->dropForeign('coupure_fiche_digitalisation_2d_id_fkey');
            $table->dropForeign('coupure_fiche_extraction_altimetrique_id_fkey');
            $table->dropForeign('coupure_fiche_feuille_id_fkey');
            $table->dropForeign('coupure_fiche_metadata_id_fkey');
            $table->dropForeign('coupure_fiche_redaction_cartographique_id_fkey');
            $table->dropForeign('coupure_fiche_traitement_vecteur_id_fkey');
            $table->dropForeign('coupure_fiche_validation_export_id_fkey');
        });
    }
};
