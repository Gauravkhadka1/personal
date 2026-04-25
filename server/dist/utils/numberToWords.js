"use strict";
// server/src/utils/numberToWords.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.numberToWords = numberToWords;
exports.numberToWordsNepali = numberToWordsNepali;
function numberToWords(num) {
    // Handle zero case
    if (num === 0)
        return "Zero";
    // Define word arrays
    const ones = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
        "Seventeen", "Eighteen", "Nineteen"
    ];
    const tens = [
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy",
        "Eighty", "Ninety"
    ];
    const thousands = ["", "Thousand", "Lakh", "Crore"];
    // Special case: negative numbers
    if (num < 0) {
        return "Minus " + numberToWords(Math.abs(num));
    }
    // Helper function to convert three-digit groups
    function convertThreeDigits(n) {
        let result = "";
        // Handle hundreds
        if (Math.floor(n / 100) > 0) {
            result += ones[Math.floor(n / 100)] + " Hundred ";
            n %= 100;
        }
        // Handle tens and ones
        if (n > 0) {
            if (n < 20) {
                result += ones[n] + " ";
            }
            else {
                result += tens[Math.floor(n / 10)] + " ";
                if (n % 10 > 0) {
                    result += ones[n % 10] + " ";
                }
            }
        }
        return result;
    }
    // Handle decimal part (paisa)
    let rupees = Math.floor(num);
    let paisa = Math.round((num - rupees) * 100);
    let result = "";
    // Convert rupees (using Indian numbering system)
    if (rupees === 0) {
        result = "Zero";
    }
    else {
        let crore = Math.floor(rupees / 10000000);
        rupees %= 10000000;
        let lakh = Math.floor(rupees / 100000);
        rupees %= 100000;
        let thousand = Math.floor(rupees / 1000);
        rupees %= 1000;
        let hundred = rupees;
        if (crore > 0) {
            result += convertThreeDigits(crore) + "Crore ";
        }
        if (lakh > 0) {
            result += convertThreeDigits(lakh) + "Lakh ";
        }
        if (thousand > 0) {
            result += convertThreeDigits(thousand) + "Thousand ";
        }
        if (hundred > 0) {
            result += convertThreeDigits(hundred);
        }
        result = result.trim() + " Rupees";
    }
    // Add paisa if exists
    if (paisa > 0) {
        result += " and " + convertThreeDigits(paisa).trim() + " Paisa";
    }
    // Capitalize first letter
    return result.charAt(0).toUpperCase() + result.slice(1);
}
// For Nepali language (optional)
function numberToWordsNepali(num) {
    const ones = [
        "", "एक", "दुई", "तीन", "चार", "पाँच", "छ", "सात", "आठ", "नौ",
        "दस", "एघार", "बाह्र", "तेह्र", "चौध", "पन्ध्र", "सोह्र", "सत्र", "अठार", "उन्नाइस"
    ];
    const tens = [
        "", "", "बीस", "तीस", "चालीस", "पचास", "साठी", "सत्तरी",
        "असी", "नब्बे"
    ];
    const thousands = ["", "हजार", "लाख", "करोड"];
    if (num === 0)
        return "शून्य";
    if (num < 0)
        return "माइनस " + numberToWordsNepali(Math.abs(num));
    let rupees = Math.floor(num);
    let paisa = Math.round((num - rupees) * 100);
    let result = "";
    // Helper function
    function convertThreeDigitsNepali(n) {
        let res = "";
        // Handle hundreds
        if (Math.floor(n / 100) > 0) {
            const hundredDigit = Math.floor(n / 100);
            res += (hundredDigit === 1 ? "एक सय " : ones[hundredDigit] + " सय ");
            n %= 100;
        }
        // Handle tens and ones
        if (n > 0) {
            if (n < 20) {
                res += ones[n] + " ";
            }
            else {
                res += tens[Math.floor(n / 10)] + " ";
                if (n % 10 > 0) {
                    res += ones[n % 10] + " ";
                }
            }
        }
        return res;
    }
    if (rupees === 0) {
        result = "शून्य";
    }
    else {
        let crore = Math.floor(rupees / 10000000);
        rupees %= 10000000;
        let lakh = Math.floor(rupees / 100000);
        rupees %= 100000;
        let thousand = Math.floor(rupees / 1000);
        rupees %= 1000;
        let hundred = rupees;
        if (crore > 0) {
            result += convertThreeDigitsNepali(crore) + "करोड ";
        }
        if (lakh > 0) {
            result += convertThreeDigitsNepali(lakh) + "लाख ";
        }
        if (thousand > 0) {
            result += convertThreeDigitsNepali(thousand) + "हजार ";
        }
        if (hundred > 0) {
            result += convertThreeDigitsNepali(hundred);
        }
        result = result.trim() + " रूपैयाँ";
    }
    if (paisa > 0) {
        result += " र " + convertThreeDigitsNepali(paisa).trim() + " पैसा";
    }
    return result;
}
