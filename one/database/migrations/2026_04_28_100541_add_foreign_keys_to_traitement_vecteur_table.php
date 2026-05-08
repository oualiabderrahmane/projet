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
        Schema::table('traitement_vecteur', function (Blueprint $table) {
            $table->foreign(['metadata_id'], 'traitement_vecteur_metadata_id_fkey')->references(['id'])->on('metadata')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['mode_realisation_id'], 'traitement_vecteur_mode_realisation_id_fkey')->references(['id'])->on('mode_realisation')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['operateur_id'], 'traitement_vecteur_operateur_id_fkey')->references(['id'])->on('users')->onUpdate('no action')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('traitement_vecteur', function (Blueprint $table) {
            $table->dropForeign('traitement_vecteur_metadata_id_fkey');
            $table->dropForeign('traitement_vecteur_mode_realisation_id_fkey');
            $table->dropForeign('traitement_vecteur_operateur_id_fkey');
        });
    }
};
