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
        Schema::table('validation_export', function (Blueprint $table) {
            $table->foreign(['metadata_id'], 'validation_export_metadata_id_fkey')->references(['id'])->on('metadata')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['operateur_id'], 'validation_export_operateur_id_fkey')->references(['id'])->on('users')->onUpdate('no action')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('validation_export', function (Blueprint $table) {
            $table->dropForeign('validation_export_metadata_id_fkey');
            $table->dropForeign('validation_export_operateur_id_fkey');
        });
    }
};
