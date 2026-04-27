import * as isoCountries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

// Register the English locale to be able to get country names and numeric conversions
isoCountries.registerLocale(enLocale);

export const getAlpha2FromNumeric = (numericId: string): string | undefined => {
    const alpha3 = isoCountries.numericToAlpha3(numericId);
    if (!alpha3) return undefined;
    return isoCountries.alpha3ToAlpha2(alpha3);
};

export const getCountryNameFromAlpha2 = (alpha2: string): string | undefined => {
    return isoCountries.getName(alpha2, 'en');
};

export const getAllCountriesAlpha2 = () => {
    return Object.keys(isoCountries.getAlpha2Codes());
};
