@echo off
setlocal

cd /d "%~dp0"

echo.
echo ==========================================
echo  FTATA - installation et lancement complet
echo ==========================================
echo.

where php >nul 2>nul
if errorlevel 1 (
    echo ERREUR: PHP est introuvable. Installez PHP 8.2 ou plus, puis relancez start.bat.
    pause
    exit /b 1
)

where composer >nul 2>nul
if errorlevel 1 (
    echo ERREUR: Composer est introuvable. Installez Composer, puis relancez start.bat.
    pause
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo ERREUR: Node.js / npm est introuvable. Installez Node.js, puis relancez start.bat.
    pause
    exit /b 1
)

if not exist ".env" (
    echo Creation du fichier .env...
    copy ".env.example" ".env" >nul
)

if not exist "database\database.sqlite" (
    echo Creation de la base SQLite...
    type nul > "database\database.sqlite"
)

echo Installation PHP...
call composer install
if errorlevel 1 goto failed

echo Installation JavaScript...
call npm install
if errorlevel 1 goto failed

findstr /B /C:"APP_KEY=base64:" ".env" >nul 2>nul
if errorlevel 1 (
    echo Generation de APP_KEY...
    call php artisan key:generate --force
    if errorlevel 1 goto failed
)

echo Nettoyage du cache Laravel...
call php artisan optimize:clear
if errorlevel 1 goto failed

echo Migrations et seeders...
call php artisan migrate --seed --force
if errorlevel 1 goto failed

echo.
echo ==========================================
echo  Application prete
echo  Laravel: http://127.0.0.1:8000
echo  Vite:    http://127.0.0.1:5173
echo ==========================================
echo.
echo Identifiants utiles:
echo  admin@example.com / password
echo  chef@example.com  / password
echo.
echo Ne fermez pas cette fenetre pendant l'utilisation.
echo.

call npx concurrently -c "blue,green" -n "laravel,vite" "php artisan serve --host=127.0.0.1 --port=8000" "npm run dev -- --host=127.0.0.1"
exit /b %errorlevel%

:failed
echo.
echo ERREUR: le lancement a echoue. Lisez le message au-dessus.
pause
exit /b 1
