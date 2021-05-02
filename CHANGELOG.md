# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.2] - 2020-10-07

### Fixed

- Fixed game breaking bug where jump height was too low for low frame rates, such that certain points in the level
  could not be passed by the player.

## [1.0.1] - 2020-10-06

### Fixed

- Improved frame rate by not rendering texts which have 0 opacity. With frame rate too low it was not possible to
  perform some jumps and therefor the game could not be completed.

## [1.0.0] - 2020-10-06

Initial release for Ludum Dare 47 game jam.
