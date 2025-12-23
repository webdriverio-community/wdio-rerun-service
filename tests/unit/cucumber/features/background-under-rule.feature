@feature-tag
Feature: Background in Rules
  As a rerun service user
  I want to test scenarios with Background steps in Rules
  So that I can ensure line numbers are captured correctly

  Background:
    Given I have a feature background

  Rule: Business rule with background
    Background:
      Given I have a rule background

    Scenario: Test scenario with backgrounds
      Given I run a test
      When something happens
      Then I expect a result
