# @euroins/frontend-translation
Euroins online frontend translations package

## Installation
Install directly from GitHub:

```bash
npm install git+https://github.com/Euroins-Georgia/euroins-frontend-translations.git
```

## Usage

After installation, you get access to these commands in your project:

### Extract Translations
```bash
npm run translations:extract
# or
npx euroins-translations extract
```
Extracts translation keys from your source code and generates/updates the CSV file.

### Import Translations
```bash
npm run translations:import  
# or
npx euroins-translations import
```
Converts CSV translations to JSON files in `i18n/messages/` directory.

### Start Translation Editor
```bash
npm run translations:editor
# or
npx euroins-translations editor
```
Opens a web interface at localhost:3029 for editing translations.

## Project Structure

The package expects your project to have:
- `i18n/translations/messages.csv` - CSV file with translations
- `i18n/messages/` - Directory for generated JSON files  
- Translation keys in source code using `t("key")` pattern


