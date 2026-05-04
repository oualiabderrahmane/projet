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
            $table->dropUnique('controle_cartographique_metadata_id_key');
            $table->unique(
                ['metadata_id', 'type_controle_id'],
                'controle_cartographique_metadata_type_key'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('controle_cartographique', function (Blueprint $table) {
            $table->dropUnique('controle_cartographique_metadata_type_key');
            $table->unique('metadata_id', 'controle_cartographique_metadata_id_key');
        });
    }
};
