# CCI Externalized Labels System

This document explains how to use the externalized labels system in the CCI application.

## Overview

The CCI application uses `react-i18next` to externalize all user-facing text into locale files. This makes the application easier to maintain and allows for future language support if needed. Currently, the application supports English only.

## Structure

```
client/src/i18n/
├── index.js              # Main i18n configuration
├── locales/
│   └── en.json          # English labels and messages
└── README.md            # This file
```

## How to Use

### 1. In React Components

```javascript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <p>{t('common.loading')}</p>
    </div>
  );
};
```

### 2. Translation Keys Structure

Translation keys are organized hierarchically for better organization:

```json
{
  "common": {
    "loading": "Loading...",
    "error": "Error"
  },
  "people": {
    "page_title": "People",
    "form": {
      "first_name": "First Name",
      "submit": "Add Member"
    }
  }
}
```

### 3. Accessing Nested Keys

```javascript
// Access nested keys using dot notation
t('people.form.first_name')        // "First Name"
t('people.form.submit')            // "Add Member"
t('common.loading')                // "Loading..."
```

## Benefits

### 1. Maintainability
- All text is centralized in one place
- Easy to find and update labels
- Consistent terminology across the application

### 2. Developer Experience
- Clear key naming conventions
- Easy to see what text is used where
- Reduced chance of typos or inconsistencies

### 3. Future Scalability
- Easy to add new languages later
- Simple to implement translation management tools
- Can support multiple locales without code changes

## Current Status

✅ **Completed**:
- i18n infrastructure setup
- English locale file with comprehensive labels
- Header component translations
- People page translations
- Home page translations
- Basic error and loading messages

🔄 **In Progress**:
- Events page translations
- Edit Home Page translations
- Admin Dashboard translations
- Authentication page translations

## Adding New Labels

When adding new features:

1. Add the English label to `en.json`
2. Use the new key in your component
3. Follow the hierarchical naming convention
4. Test to ensure the label displays correctly

## Example: Adding a New Feature

### 1. Add to English Locale

```json
{
  "new_feature": {
    "title": "New Feature",
    "description": "This is a new feature",
    "button": "Try It"
  }
}
```

### 2. Use in Component

```javascript
const NewFeature = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h2>{t('new_feature.title')}</h2>
      <p>{t('new_feature.description')}</p>
      <button>{t('new_feature.button')}</button>
    </div>
  );
};
```

## Troubleshooting

### Common Issues

1. **Translation not found**: Check if the key exists in `en.json`
2. **Missing translations**: Ensure all new text uses the `t()` function
3. **Console errors**: Look for missing key warnings

### Debug Mode

Enable debug mode in `client/src/i18n/index.js`:

```javascript
i18n.init({
  debug: true,  // Add this line
  // ... other options
});
```

This will log missing translations to the console.

## Resources

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [i18next Configuration Options](https://www.i18next.com/overview/configuration-options)
