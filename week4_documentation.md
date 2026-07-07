# Week 4: Horizon United FC Registration Form

This document provides a comprehensive overview of the week 4 codebase, detailing the files created and the technical/design decisions made while building the Horizon United FC Registration Form.

## Project Overview
The goal was to transform a basic, single-step HTML form into a sleek, premium, and interactive multi-step registration experience. The design adheres to a strict color palette: Black (`#000000` / `#050505`), Gold (`#FFD700`), and White (`#FFFFFF`).

---

## File Structure

The project consists of three core files, strictly adhering to the separation of concerns (HTML for structure, CSS for presentation, JS for behavior):

1. `task1.html`: The main structural file containing the form elements.
2. `style.css`: The external stylesheet handling all visual aesthetics and layout.
3. `script.js`: The logic file handling step-by-step navigation.

---

## Technical and Design Decisions

### 1. HTML Structure (`task1.html`)
- **Multi-Step Architecture:** Instead of overwhelming the user with a massive list of inputs, the form was broken down into 6 logical steps (Personal, Football Info, Medical, Education, Parent/Guardian, Commitment). Each step is wrapped in a `<div class="form-step">`.
- **Semantic Tags:** Used `<fieldset>` and `<legend>` to group related fields semantically, improving accessibility.
- **Zero Internal CSS:** As explicitly requested, no `<style>` tags or inline `style="..."` attributes were used. Everything is linked via `<link rel="stylesheet" href="style.css">`.
- **Validation Removed:** HTML5 `required` attributes were intentionally removed to allow free navigation across all steps for testing and layout verification purposes.

### 2. Styling and Layout (`style.css`)
- **Premium Dark Theme:** To achieve a "wow" factor and a premium feel, the background was set to a deep black (`#050505`), with the form container using a slightly lighter dark shade (`#121212`). This makes the Gold (`#FFD700`) accents pop beautifully.
- **CSS Grid (The Arrangement):** Instead of a single column of inputs, a 2-column layout was implemented using CSS Grid (`.form-grid`). This groups related fields side-by-side (e.g., First Name next to Last Name), making better use of desktop screen space.
- **Micro-interactions:** Smooth CSS transitions were added to inputs (`:focus` states glow gold), buttons (hover effects that raise the button slightly), and step transitions (`@keyframes fadeIn` so steps slide in elegantly rather than jarringly appearing).
- **Mobile Responsiveness:** A media query (`@media (max-width: 600px)`) was added to ensure that on mobile devices, the 2-column grid automatically collapses into a 1-column layout, and padding/font sizes scale down to fit smaller screens.

### 3. Navigation Logic (`script.js`)
- **Vanilla JavaScript:** Decided to use pure, vanilla JavaScript to handle the multi-step logic to keep the codebase lightweight and avoid heavy frameworks or libraries (like jQuery).
- **State Management:** The script tracks the current step using a simple index variable (`formStepsNum`). 
- **Dynamic DOM Manipulation:** When "Next" or "Previous" is clicked, the script updates the DOM by adding/removing the `.active` class from the respective form steps. 
- **Progress Bar Calculation:** The width of the visual progress bar line is calculated dynamically based on the current step index relative to the total number of steps, ensuring it always aligns perfectly with the active step circle.
