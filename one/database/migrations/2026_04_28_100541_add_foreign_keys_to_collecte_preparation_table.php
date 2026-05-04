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
        Schema::table('collecte_preparation', function (Blueprint $table) {
            $table->foreign(['metadata_id'], 'collecte_preparation_metadata_id_fkey')->references(['id'])->on('metadata')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['type_osm_id'], 'collecte_preparation_type_osm_id_fkey')->references(['id'])->on('types_osm')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('collecte_preparation', function (Blueprint $table) {
            $table->dropForeign('collecte_preparation_metadata_id_fkey');
            $table->dropForeign('collecte_preparation_type_osm_id_fkey');
        });
    }
};
