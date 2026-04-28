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
        Schema::table('controle_cartographique', function (Blueprint $table) {
            $table->foreign(['metadata_id'], 'controle_cartographique_metadata_id_fkey')->references(['id'])->on('metadata')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['niveau_controle_id'], 'controle_cartographique_niveau_controle_id_fkey')->references(['id'])->on('niveaux_controle')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['type_controle_id'], 'controle_cartographique_type_controle_id_fkey')->references(['id'])->on('types_controle')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('controle_cartographique', function (Blueprint $table) {
            $table->dropForeign('controle_cartographique_metadata_id_fkey');
            $table->dropForeign('controle_cartographique_niveau_controle_id_fkey');
            $table->dropForeign('controle_cartographique_type_controle_id_fkey');
        });
    }
};
