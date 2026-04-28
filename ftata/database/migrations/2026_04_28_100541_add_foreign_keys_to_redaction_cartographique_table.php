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
        Schema::table('redaction_cartographique', function (Blueprint $table) {
            $table->foreign(['metadata_id'], 'redaction_cartographique_metadata_id_fkey')->references(['id'])->on('metadata')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('redaction_cartographique', function (Blueprint $table) {
            $table->dropForeign('redaction_cartographique_equipement_id_fkey');
            $table->dropForeign('redaction_cartographique_metadata_id_fkey');
        });
    }
};
