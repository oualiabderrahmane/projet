<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const PHASE_TABLES = [
        'collecte_preparation' => [
            'role' => 'collect',
            'foreign' => 'collecte_preparation_operateur_id_fkey',
        ],
        'extraction_altimetrique' => [
            'role' => 'extraction',
            'foreign' => 'extraction_altimetrique_operateur_id_fkey',
        ],
        'digitalisation_2d' => [
            'role' => 'digitalisation',
            'foreign' => 'digitalisation_2d_operateur_id_fkey',
        ],
        'completement_spatial' => [
            'role' => 'completment_spatial',
            'foreign' => 'completement_spatial_operateur_id_fkey',
        ],
        'traitement_vecteur' => [
            'role' => 'traitment_vecteur',
            'foreign' => 'traitement_vecteur_operateur_id_fkey',
        ],
        'redaction_cartographique' => [
            'role' => 'redaction',
            'foreign' => 'redaction_cartographique_operateur_id_fkey',
        ],
        'controle_cartographique' => [
            'role' => 'redaction',
            'foreign' => 'controle_cartographique_operateur_id_fkey',
        ],
        'validation_export' => [
            'role' => 'redaction',
            'foreign' => 'validation_export_operateur_id_fkey',
        ],
    ];

    public function up(): void
    {
        $this->syncUserColumns();
        $this->backfillUsers();
        $this->dropOldUserColumns();
        $this->syncPhaseOperatorForeignKeys();
        $this->dropOldReferenceTables();
    }

    public function down(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (!Schema::hasColumn('users', 'name')) {
                    $table->string('name', 100)->nullable();
                }

                if (!Schema::hasColumn('users', 'phone')) {
                    $table->string('phone', 30)->nullable();
                }
            });

            DB::table('users')
                ->select(['id', 'nom', 'prenom'])
                ->orderBy('id')
                ->get()
                ->each(function ($user): void {
                    DB::table('users')
                        ->where('id', $user->id)
                        ->update([
                            'name' => trim(($user->nom ?? '') . ' ' . ($user->prenom ?? '')),
                        ]);
                });
        }
    }

    private function syncUserColumns(): void
    {
        if (!Schema::hasTable('users')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'nom')) {
                $table->string('nom', 100)->nullable();
            }

            if (!Schema::hasColumn('users', 'prenom')) {
                $table->string('prenom', 100)->nullable();
            }

            if (!Schema::hasColumn('users', 'role_id')) {
                $table->unsignedBigInteger('role_id')->nullable();
            }

            if (!Schema::hasColumn('users', 'grade_id')) {
                $table->unsignedBigInteger('grade_id')->nullable();
            }

            if (!Schema::hasColumn('users', 'poste_id')) {
                $table->unsignedBigInteger('poste_id')->nullable();
            }
        });

        $this->addForeignIfMissing('users', 'users_role_id_foreign', 'role_id', 'roles');
        $this->addForeignIfMissing('users', 'users_grade_id_foreign', 'grade_id', 'grades');
        $this->addForeignIfMissing('users', 'users_poste_id_foreign', 'poste_id', 'postes');
    }

    private function backfillUsers(): void
    {
        if (!Schema::hasTable('users')) {
            return;
        }

        if (Schema::hasColumn('users', 'name')) {
            DB::table('users')
                ->select(['id', 'name'])
                ->orderBy('id')
                ->get()
                ->each(function ($user): void {
                    $parts = preg_split('/\s+/', trim((string) $user->name), 2);

                    DB::table('users')
                        ->where('id', $user->id)
                        ->update([
                            'nom' => $parts[0] ?: 'Utilisateur',
                            'prenom' => $parts[1] ?? null,
                        ]);
                });
        }

        DB::table('users')
            ->whereNull('nom')
            ->orWhere('nom', '')
            ->select(['id'])
            ->orderBy('id')
            ->get()
            ->each(function ($user): void {
                DB::table('users')
                    ->where('id', $user->id)
                    ->update(['nom' => 'Utilisateur ' . $user->id]);
            });

        if (Schema::hasTable('user_roles')) {
            DB::table('user_roles')
                ->select('user_id', DB::raw('MIN(role_id) as role_id'))
                ->groupBy('user_id')
                ->get()
                ->each(function ($row): void {
                    DB::table('users')
                        ->where('id', $row->user_id)
                        ->update(['role_id' => $row->role_id]);
                });
        }
    }

    private function dropOldUserColumns(): void
    {
        if (!Schema::hasTable('users')) {
            return;
        }

        $this->dropForeignIfExists('users', 'users_fonction_id_foreign');

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'fonction_id')) {
                $table->dropColumn('fonction_id');
            }

            if (Schema::hasColumn('users', 'phone')) {
                $table->dropColumn('phone');
            }

            if (Schema::hasColumn('users', 'name')) {
                $table->dropColumn('name');
            }
        });
    }

    private function syncPhaseOperatorForeignKeys(): void
    {
        foreach (self::PHASE_TABLES as $tableName => $config) {
            if (!Schema::hasTable($tableName) || !Schema::hasColumn($tableName, 'operateur_id')) {
                continue;
            }

            $this->dropForeignIfExists($tableName, $config['foreign']);

            $userId = $this->firstUserIdForRole($config['role']);

            DB::table($tableName)
                ->whereNotNull('operateur_id')
                ->update(['operateur_id' => $userId]);

            $this->addForeignIfMissing($tableName, $config['foreign'], 'operateur_id', 'users');
        }
    }

    private function dropOldReferenceTables(): void
    {
        Schema::dropIfExists('operateurs');
        Schema::dropIfExists('fonctions');
    }

    private function firstUserIdForRole(string $roleName): ?int
    {
        $roleName = strtolower($roleName);

        return DB::table('users')
            ->leftJoin('roles as direct_roles', 'users.role_id', '=', 'direct_roles.id')
            ->leftJoin('user_roles', 'users.id', '=', 'user_roles.user_id')
            ->leftJoin('roles as pivot_roles', 'user_roles.role_id', '=', 'pivot_roles.id')
            ->where(function ($query) use ($roleName): void {
                $query
                    ->whereRaw('LOWER(direct_roles.name) = ?', [$roleName])
                    ->orWhereRaw('LOWER(pivot_roles.name) = ?', [$roleName]);
            })
            ->orderBy('users.id')
            ->value('users.id');
    }

    private function addForeignIfMissing(string $tableName, string $constraintName, string $column, string $referencesTable): void
    {
        if (
            !Schema::hasTable($tableName)
            || !Schema::hasTable($referencesTable)
            || !Schema::hasColumn($tableName, $column)
            || $this->foreignExists($tableName, $constraintName)
        ) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table) use ($constraintName, $column, $referencesTable): void {
            $table
                ->foreign($column, $constraintName)
                ->references('id')
                ->on($referencesTable)
                ->nullOnDelete();
        });
    }

    private function dropForeignIfExists(string $tableName, string $constraintName): void
    {
        if (!$this->foreignExists($tableName, $constraintName)) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table) use ($constraintName): void {
            $table->dropForeign($constraintName);
        });
    }

    private function foreignExists(string $tableName, string $constraintName): bool
    {
        if (DB::getDriverName() !== 'pgsql') {
            return false;
        }

        return DB::table('pg_constraint as c')
            ->join('pg_class as t', 'c.conrelid', '=', 't.oid')
            ->where('t.relname', $tableName)
            ->where('c.conname', $constraintName)
            ->exists();
    }
};
