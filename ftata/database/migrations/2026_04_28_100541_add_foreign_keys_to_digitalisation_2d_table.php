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
        Schema::table('digitalisation_2d', function (Blueprint $table) {
            $table->foreign(['metadata_id'], 'digitalisation_2d_metadata_id_fkey')->references(['id'])->on('metadata')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['mode_realisation_id'], 'digitalisation_2d_mode_realisation_id_fkey')->references(['id'])->on('modes_realisation')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('digitalisation_2d', function (Blueprint $table) {
            $table->dropForeign('digitalisation_2d_equipement_id_fkey');
            $table->dropForeign('digitalisation_2d_metadata_id_fkey');
            $table->dropForeign('digitalisation_2d_mode_realisation_id_fkey');
        });
    }
};
