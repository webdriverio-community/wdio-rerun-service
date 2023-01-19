# Changelog

> **Tags:**
> - :boom:       [Breaking Change]
> - :eyeglasses: [Spec Compliancy]
> - :rocket:     [New Feature]
> - :bug:        [Bug Fix]
> - :memo:       [Documentation]
> - :house:      [Internal]
> - :nail_care:  [Polish]

_Note: Gaps between patch versions are faulty, broken or test releases._

---

## v2.0.6 (2023-1-19)
#### :bug: Bug Fix
* [[#56]](https://github.com/webdriverio-community/wdio-rerun-service/pull/56) [v8] Generate failure line number at Example data line ([@cesar-rivera](https://github.com/cesar-rivera), [@wenzhhu](https://github.com/wenzhhu))
* [[#58]](https://github.com/webdriverio-community/wdio-rerun-service/pull/58) Use correct property when determining framework ([@esaari](https://github.com/esaari))

#### Committers: 3
- [@wenzhhu](https://github.com/wenzhhu)
- [@esaari](https://github.com/esaari)
- [@cesar-rivera](https://github.com/cesar-rivera)

## v1.7.8 (2023-01-18)
#### :bug: Bug Fix
* Service release; no new features/fixes

## v1.7.7 (2023-01-18)
#### :bug: Bug Fix
* [[#53]](https://github.com/webdriverio-community/wdio-rerun-service/pull/53) Generate failure line number at Example data line rather than the Scenario Outline line ([@wenzhhu](https://github.com/wenzhhu))

#### Committers: 1
- [@wenzhhu](https://github.com/wenzhhu)

## v2.0.4 (2022-12-28)
#### :house: Internal
* [[#54]](https://github.com/webdriverio-community/wdio-rerun-service/pull/54) Update test.yml to include v7 and lts branches ([@mikesavia](https://github.com/mikesavia))

#### Committers: 1
- [@mikesavia](https://github.com/mikesavia)

## v2.0.3 (2022-12-28)
#### :house: Internal
* update .npmignore ([@SCG82](https://github.com/SCG82))

#### Committers: 1
- [@SCG82](https://github.com/SCG82)

## v2.0.2 (2022-12-28)
#### :bug: Bug Fix
* [[#51]](https://github.com/webdriverio-community/wdio-rerun-service/pull/51) fix: replace uuid v5 with v4 to ensure unique ids ([@SCG82](https://github.com/SCG82))

#### Committers: 1
- [@SCG82](https://github.com/SCG82)

## v2.0.1 (2022-12-28)
#### :memo: Documentation
* Fix: incorrect links in README ([@SCG82](https://github.com/SCG82))

#### Committers: 1
- [@SCG82](https://github.com/SCG82)

## v2.0.0 (2022-12-25)
#### :rocket: New Feature
* [[#42]](https://github.com/webdriverio-community/wdio-rerun-service/pull/42) Convert to Typescript with dual ESM/CJS output ([@SCG82](https://github.com/SCG82))
#### :bug: Bug Fix
* [[#47]](https://github.com/webdriverio-community/wdio-rerun-service/pull/47) Fix rerun script for Windows ([@SCG82](https://github.com/SCG82))
#### :nail_care: Polish
* [[#46]](https://github.com/webdriverio-community/wdio-rerun-service/pull/46) improve tests ([@SCG82](https://github.com/SCG82))
* [[#48]](https://github.com/webdriverio-community/wdio-rerun-service/pull/48) disable if DISABLE_RERUN is true ([@SCG82](https://github.com/SCG82))

#### Committers: 1
- [@SCG82](https://github.com/SCG82)

## v1.7.6 (2022-09-13)
#### :bug: Bug Fix
* [[#41]](https://github.com/webdriverio-community/wdio-rerun-service/pull/41) Update to work with newer versions of @wdio/cucumber-framework ([@mikesavia](https://github.com/mikesavia))

#### Committers: 1
- [@mikesalvia](https://github.com/mikesalvia)

## v1.7.3 (2022-04-19)
#### :bug: Bug Fix
* [[#31]](https://github.com/webdriverio-community/wdio-rerun-service/pull/31) Fixing WDIO v7 status code usage ([@ccristobal-skillz](https://github.com/ccristobal-skillz))
* [[#26]](https://github.com/webdriverio-community/wdio-rerun-service/pull/26) Ensure element contains scenario inside filter function ([@yopasa94](https://github.com/yopasa94))

#### :nail_care: Polish
* [[#32]](https://github.com/webdriverio-community/wdio-rerun-service/pull/32) Update dependencies, move to fixed static versions ([@esaari](https://github.com/esaari))

#### Committers: 3
- [@ccristobal-skillz](https://github.com/ccristobal-skillz)
- [@yopasa94](https://github.com/yopasa94)
- [@esaari](https://github.com/esaari)


## v1.7.2 (2021-06-24)

#### :nail_care: Polish
* Service release; no new features or fixes 

#### Committers: 1
- [@esaari](https://github.com/esaari)

## v1.7.1 (2021-06-24)

#### :nail_care: Polish
* [[#20]](https://github.com/webdriverio-community/wdio-rerun-service/pull/20) Use lockfileVersion:2 ([@esaari](https://github.com/esaari))
* [[#20]](https://github.com/webdriverio-community/wdio-rerun-service/pull/20) Update `package.json` URLs to reflect webdriverio-community location ([@esaari](https://github.com/esaari))
* [[#20]](https://github.com/webdriverio-community/wdio-rerun-service/pull/20) Dependency bumps ([@esaari](https://github.com/esaari))

#### Committers: 1
- [@esaari](https://github.com/esaari)

## v1.7.0 (2021-03-01)

#### :bug: Bug Fix
* [[#9]](https://github.com/webdriverio-community/wdio-rerun-service/pull/9) Fix Cucumber hooks, so we're now compatible with WDIO v7 ([@esaari](https://github.com/esaari))
#### :memo: Documentation
* [[#9]](https://github.com/webdriverio-community/wdio-rerun-service/pull/9) Readme updates for clarity ([@esaari](https://github.com/esaari))
#### ::nail_care:: Polish
* [[#9]](https://github.com/webdriverio-community/wdio-rerun-service/pull/9) Filter `skipped` Cucumber scenarios from being included in rerun ([@esaari](https://github.com/esaari))

#### Committers: 1
- [@esaari](https://github.com/esaari)

## v1.6.0 (2021-02-26)

#### :rocket: New Feature
* [[#11]](https://github.com/webdriverio-community/wdio-rerun-service/pull/11) Fix issue with Windows-style separators, add CHANGELOG.md ([@mikesalvia](https://github.com/mikesalvia))*
#### :bug: Bug Fix
* [[#10]](https://github.com/webdriverio-community/wdio-rerun-service/pull/10) Ensure failure locations are unique so there are no duplicates created in re-run.sh ([@mikesalvia](https://github.com/mikesalvia))
#### :memo: Documentation
#### :house: Internal

#### Committers: 1
- [@mikesalvia](https://github.com/mikesalvia)
