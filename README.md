# Flute Generator

A web-based tool for designing, generating, and analyzing 3D-printed flutes. This application provides an end-to-end workflow for creating custom wind instruments, from parametric design through acoustic analysis and STL file generation for 3D printing.

[Try it here](https://print-flute.vercel.app/)

## Overview

This project enables makers and musicians to design functional flutes with precise control over acoustic and physical parameters. The tool combines computational acoustics, 3D geometry generation, and real-time audio analysis to create instruments that can be fabricated on consumer 3D printers.

## Features

### Parametric Design

The design interface provides control over key flute parameters organized into three categories:

**Physical Parameters**
- Bore diameter: Controls the internal tube diameter, affecting volume and tone quality
- Wall thickness: Determines structural strength and acoustic resonance
- Thumb hole: Optional back-facing hole for extended range
- Overhang length: Distance the tube extends beyond the embouchure hole
- Cork distance and thickness: Parameters for the end cap that affect tuning

**Embouchure Hole Parameters**
- Hole length and width: Dimensions of the blow hole that determine airflow characteristics
- Lip coverage: Percentage of hole coverage affecting tone color and pitch stability

**Tuning Parameters**
- Fundamental frequency: Sets the base pitch and key of the instrument
- Number of tone holes: Configures the finger hole count for note range

### 3D Model Generation

The application generates complete 3D geometry based on design parameters:
- Cylindrical bore with configurable dimensions
- Precisely positioned embouchure hole and finger holes
- Cork and mounting features
- Export to STL format for direct 3D printing

### Acoustic Analysis

Real-time audio analysis tools for validating and refining designs:
- Pitch detection using the Web Audio API
- Harmonic analysis to assess tone quality
- Frequency spectrum visualization
- Comparison between predicted and actual pitches
- Quality metrics for evaluating instrument performance

### Design Workflow

The application guides users through a two-step process:
1. Main Geometry: Configure all acoustic and physical parameters
2. Process for Printing: Prepare the design for fabrication

## Technical Architecture

Built with modern web technologies for performance and accessibility:
- **Frontend Framework**: SvelteKit for reactive UI components
- **3D Rendering**: Three.js for real-time geometry visualization
- **Audio Processing**: Web Audio API for pitch detection and spectral analysis
- **Acoustic Calculations**: Custom algorithms for frequency prediction and hole positioning
- **File Export**: STL generation for 3D printing compatibility

## Project Structure

The codebase is organized by functional domain:
- `acoustics/`: Pure acoustic calculations and frequency algorithms
- `geometry/`: Three.js mesh generation and 3D modeling
- `audio/`: Pitch detection, harmonic analysis, and audio capture
- `components/`: Svelte UI components for design and analysis
- `stores/`: Application state management

## Use Cases

- Educational tool for learning about acoustic physics and instrument design
- Rapid prototyping of custom flute designs
- Experimentation with non-traditional tunings and scales
- Creating instruments optimized for specific acoustic requirements
- Validating theoretical acoustic models with real-world measurements

## Development

```bash
npm install
npm run dev
```

The application runs entirely in the browser with no server-side dependencies.