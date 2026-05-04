<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const WORKFLOW_TABLES = [
        'digitalisation_2d',
        'traitement_vecteur',
        'redaction_cartographique',
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('formats', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 100);
        });

        foreach (self::WORKFLOW_TABLES as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                $table->foreignId('format_id')
                    ->nullable()
                    ->after('version_logiciel')
                    ->constrained('formats', indexName: "{$tableName}_format_id_fkey")
                    ->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach (array_reverse(self::WORKFLOW_TABLES) as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                $table->dropForeign("{$tableName}_format_id_fkey");
                $table->dropColumn('format_id');
            });
        }

        Schema::dropIfExists('formats');
    }
};
