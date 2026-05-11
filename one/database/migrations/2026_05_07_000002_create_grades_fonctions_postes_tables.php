


<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 100)->unique();
            $table->timestamps();
        });

        Schema::create('postes', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 100)->unique();
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('role_id')->nullable()->after('password')->constrained('roles')->nullOnDelete();
            $table->foreignId('grade_id')->nullable()->constrained('grades')->nullOnDelete();
            $table->foreignId('poste_id')->nullable()->constrained('postes')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropForeign(['grade_id']);
            $table->dropForeign(['poste_id']);
            $table->dropColumn(['role_id', 'grade_id', 'poste_id']);
        });

        Schema::dropIfExists('postes');
        Schema::dropIfExists('grades');
    }
};
