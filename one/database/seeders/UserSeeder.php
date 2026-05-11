<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use App\Models\Grade;
use App\Models\Poste;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [

            // ================= RÉDACTION =================

            ['Bouchachi', 'Ibrahim', 'Lieutenant-colonel', 'Rédaction'],
            ['Bousaha', 'Nabil', 'Capitaine', 'Rédaction'],
            ['Touari', 'Ayoub', 'Capitaine', 'Admin'],
            ['Boutarek', 'Ibrahim', 'Adjudant', 'Rédaction'],
            ['Maleki', 'Rachad', 'Adjudant', 'Rédaction'],
            ['Ben Zeroual', 'Slim', 'Sergent-chef', 'Rédaction'],
            ['Ben Hedhoud', 'Soheib', 'Sergent-chef', 'Rédaction'],
            ['Belkacemi', 'Hassan', 'Sergent-chef', 'Rédaction'],
            ['Agoun', 'Maamar', 'Sergent-chef', 'Rédaction'],
            ['Bouljennat', 'Mohamed Yacine', 'Sergent-chef', 'Rédaction'],
            ['Diab', 'Aymen', 'Sergent-chef', 'Rédaction'],
            ['Hanoufa', 'Said Ahmed', 'Sergent-chef', 'Rédaction'],
            ['Ben Tekouk', 'Kader', 'Sergent-chef', 'Rédaction'],
            ['Yaich', 'El Hassan', 'PCA', 'Rédaction'],
            ['Miziani', 'Morad', 'PCA', 'Rédaction'],

            // ================= DIGITALISATION =================

            ['Koraich', 'Imad Eddine', 'Capitaine', 'Digitalisation'],
            ['Said', 'Abderraouf', 'Adjudant', 'Digitalisation'],
            ['Hamdi', 'Abdelaziz', 'Adjudant', 'Digitalisation'],
            ['Amer', 'Abdelmadjid', 'Sergent-chef', 'Digitalisation'],
            ['Chahrour', 'Amine', 'Sergent-chef', 'Digitalisation'],
            ['Souissi', 'Sofiane', 'Sergent-chef', 'Digitalisation'],
            ['Hamrani', 'Sofiane', 'Sergent-chef', 'Digitalisation'],
            ['Bouzmarane', 'Mansour', 'Sergent-chef', 'Digitalisation'],
            ['Belhouane', 'Ammar', 'Sergent-chef', 'Digitalisation'],
            ['Kellious', 'Walid', 'Sergent-chef', 'Digitalisation'],
            ['Dehamchia', 'Mohamed', 'Sergent-chef', 'Digitalisation'],
            ['Djouder', 'Yahia', 'Sergent-chef', 'Digitalisation'],
            ['Chadi', 'Othmane', 'Sergent-chef', 'Digitalisation'],
            ['Mehidi', 'Ibrahim', 'Sergent-chef', 'Digitalisation'],
            ['Assaidi', 'Abderrahim', 'Sergent-chef', 'Digitalisation'],
            ['Messai', 'Okba', 'Sergent-chef', 'Digitalisation'],

            // ================= TRAITEMENT =================

            ['Litim', 'Rezki', 'Adjudant-chef', 'Traitement vecteur'],
            ['Achaichia', 'Badis', 'Adjudant', 'Digitalisation'],
            ['Chelih', 'Mohamed Amine', 'Adjudant', 'Traitement vecteur'],
            ['Faouzi', 'Abdelkrim Abderraouf', 'Sergent-chef', 'Rédaction'],
            ['El Amri', 'Hamza', 'Sergent-chef', 'Rédaction'],
            ['Ghioub', 'Ahmed', 'Sergent-chef', 'Digitalisation'],

            // ================= COLLECT =================

            ['Fetata', 'Fouad', 'Commandant', 'Collect'],

            // ================= TRAITEMENT VECTEUR =================

            ['Benali', 'Ali', 'Commandant', 'Traitement vecteur'],
            ['Beloul', 'Fateh Eddine', 'Lieutenant', 'Complément spatial'],
            ['Agoun', 'Kaddour', 'Adjudant', 'Traitement vecteur'],
            ['Khaldi', 'Mohamed Cherif', 'Adjudant', 'Complément spatial'],
            ['Bouziane', 'Fares', 'Adjudant', 'Traitement vecteur'],
            ['Bellatar', 'Anouar', 'Adjudant', 'Traitement vecteur'],
            ['Ghioub', 'Seddik', 'Adjudant', 'Traitement vecteur'],
            ['Zerigui', 'Abdellatif', 'Sergent-chef', 'Complément spatial'],
            ['Khafi', 'Mohamed', 'Sergent-chef', 'Traitement vecteur'],
            ['Mahmoudi', 'Mohamed', 'Sergent-chef', 'Traitement vecteur'],
            ['Fefaa', 'Omar', 'Sergent-chef', 'Traitement vecteur'],
            ['Cherak', 'Kenza', 'PCA', 'Traitement vecteur'],

            // ================= EXTRACTION =================

            ['Zrizer', 'Hicham', 'Capitaine', 'Extraction'],
            ['Nsaybia', 'Khalil', 'Capitaine', 'Extraction'],
            ['Boumlit', 'Imad Eddine', 'Adjudant', 'Extraction'],
            ['Soufi', 'Omar', 'Adjudant', 'Extraction'],
            ['Bellaid', 'Ismail', 'Sergent-chef', 'Extraction'],
            ['Amrane', 'Faiz Samir', 'Sergent-chef', 'Extraction'],
            ['Khaled', 'Kaddour', 'Sergent-chef', 'Extraction'],
        ];

        $operatorGrades = [
            'Sergent',
            'Sergent-chef',
            'Adjudant',
            'Adjudant-chef',
            'PCA',
        ];

        foreach ($users as $index => [$nom, $prenom, $gradeName, $roleName]) {

            $grade = Grade::where('nom', $gradeName)->firstOrFail();
            $role = Role::where('name', $roleName)->firstOrFail();

            $posteName = in_array($gradeName, $operatorGrades)
                ? 'Opérateur'
                : 'Chef de service';

            $poste = Poste::where('nom', $posteName)->firstOrFail();

            User::updateOrCreate(
                [
                    'email' => Str::slug($nom . '.' . $prenom) . '@example.com'
                ],
                [
                    'name' => strtolower($nom . '.' . $prenom),
                    'nom' => $nom,
                    'prenom' => $prenom,
                    'password' => Hash::make('password'),
                    'role_id' => $role->id,
                    'grade_id' => $grade->id,
                    'poste_id' => $poste->id,
                ]
            );
        }
    }
}
