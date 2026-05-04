<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const RENAMES = [
        'Integration' => 'Intégration des données',
        'Traitement' => 'Traitement des données',
        'Les deux' => 'Intégration et traitement',
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        foreach (self::RENAMES as $oldName => $newName) {
            DB::table('mode_realisation')
                ->where('nom', $oldName)
                ->update(['nom' => $newName]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach (self::RENAMES as $oldName => $newName) {
            DB::table('mode_realisation')
                ->where('nom', $newName)
                ->update(['nom' => $oldName]);
        }
    }
};
