import { AggregatedResult } from '@jest/reporters';
import { pluralize, formatTime } from 'jest-util';
import * as chalk from 'chalk';

/**
 * Copied from the jest repo because these utility functions are not exposed through the package
 * https://github.com/facebook/jest/blob/7a64ede2163eba4ecc725f448cd92102cd8c14aa/packages/jest-reporters/src/utils.ts
 */

const PROGRESS_BAR_WIDTH = 40;

const getValuesCurrentTestCases = (currentTestCases = []) => {
  let numFailingTests = 0;
  let numPassingTests = 0;
  let numPendingTests = 0;
  let numTodoTests = 0;
  let numTotalTests = 0;
  currentTestCases.forEach((testCase) => {
    switch (testCase.testCaseResult.status) {
      case 'failed': {
        numFailingTests++;
        break;
      }
      case 'passed': {
        numPassingTests++;
        break;
      }
      case 'skipped': {
        numPendingTests++;
        break;
      }
      case 'todo': {
        numTodoTests++;
        break;
      }
    }
    numTotalTests++;
  });

  return {
    numFailingTests,
    numPassingTests,
    numPendingTests,
    numTodoTests,
    numTotalTests,
  };
};

const renderTime = (runTime: number, estimatedTime: number, width: number) => {
  // If we are more than one second over the estimated time, highlight it.
  const renderedTime =
    estimatedTime && runTime >= estimatedTime + 1
      ? chalk.bold.yellow(formatTime(runTime, 0))
      : formatTime(runTime, 0);
  let time = chalk.bold(`Time:`) + `        ${renderedTime}`;
  if (runTime < estimatedTime) {
    time += `, estimated ${formatTime(estimatedTime, 0)}`;
  }

  // Only show a progress bar if the test run is actually going to take
  // some time.
  if (estimatedTime > 2 && runTime < estimatedTime && width) {
    const availableWidth = Math.min(PROGRESS_BAR_WIDTH, width);
    const length = Math.min(
      Math.floor((runTime / estimatedTime) * availableWidth),
      availableWidth
    );
    if (availableWidth >= 2) {
      time +=
        '\n' +
        chalk.green('█').repeat(length) +
        chalk.white('█').repeat(availableWidth - length);
    }
  }
  return time;
};

export const getSummary = (
  aggregatedResults: AggregatedResult,
  options?: {
    currentTestCases?: any;
    estimatedTime?: number;
    roundTime?: boolean;
    width?: number;
  }
): string => {
  let runTime = (Date.now() - aggregatedResults.startTime) / 1000;
  if (options?.roundTime) {
    runTime = Math.floor(runTime);
  }

  const valuesForCurrentTestCases = getValuesCurrentTestCases(
    options?.currentTestCases
  );

  const estimatedTime = options?.estimatedTime || 0;
  const snapshotResults = aggregatedResults.snapshot;
  const snapshotsAdded = snapshotResults.added;
  const snapshotsFailed = snapshotResults.unmatched;
  const snapshotsOutdated = snapshotResults.unchecked;
  const snapshotsFilesRemoved = snapshotResults.filesRemoved;
  const snapshotsDidUpdate = snapshotResults.didUpdate;
  const snapshotsPassed = snapshotResults.matched;
  const snapshotsTotal = snapshotResults.total;
  const snapshotsUpdated = snapshotResults.updated;
  const suitesFailed = aggregatedResults.numFailedTestSuites;
  const suitesPassed = aggregatedResults.numPassedTestSuites;
  const suitesPending = aggregatedResults.numPendingTestSuites;
  const suitesRun = suitesFailed + suitesPassed;
  const suitesTotal = aggregatedResults.numTotalTestSuites;
  const testsFailed = aggregatedResults.numFailedTests;
  const testsPassed = aggregatedResults.numPassedTests;
  const testsPending = aggregatedResults.numPendingTests;
  const testsTodo = aggregatedResults.numTodoTests;
  const testsTotal = aggregatedResults.numTotalTests;
  const width = options?.width || 0;

  const suites =
    chalk.bold('Test Suites: ') +
    (suitesFailed ? chalk.bold.red(`${suitesFailed} failed`) + ', ' : '') +
    (suitesPending
      ? chalk.bold.yellow(`${suitesPending} skipped`) + ', '
      : '') +
    (suitesPassed ? chalk.bold.green(`${suitesPassed} passed`) + ', ' : '') +
    (suitesRun !== suitesTotal
      ? suitesRun + ' of ' + suitesTotal
      : suitesTotal) +
    ` total`;

  const updatedTestsFailed =
    testsFailed + valuesForCurrentTestCases.numFailingTests;
  const updatedTestsPending =
    testsPending + valuesForCurrentTestCases.numPendingTests;
  const updatedTestsTodo = testsTodo + valuesForCurrentTestCases.numTodoTests;
  const updatedTestsPassed =
    testsPassed + valuesForCurrentTestCases.numPassingTests;
  const updatedTestsTotal =
    testsTotal + valuesForCurrentTestCases.numTotalTests;

  const tests =
    chalk.bold('Tests:       ') +
    (updatedTestsFailed > 0
      ? chalk.bold.red(`${updatedTestsFailed} failed`) + ', '
      : '') +
    (updatedTestsPending > 0
      ? chalk.bold.yellow(`${updatedTestsPending} skipped`) + ', '
      : '') +
    (updatedTestsTodo > 0
      ? chalk.bold.magenta(`${updatedTestsTodo} todo`) + ', '
      : '') +
    (updatedTestsPassed > 0
      ? chalk.bold.green(`${updatedTestsPassed} passed`) + ', '
      : '') +
    `${updatedTestsTotal} total`;

  const snapshots =
    chalk.bold('Snapshots:   ') +
    (snapshotsFailed
      ? chalk.bold.red(`${snapshotsFailed} failed`) + ', '
      : '') +
    (snapshotsOutdated && !snapshotsDidUpdate
      ? chalk.bold.yellow(`${snapshotsOutdated} obsolete`) + ', '
      : '') +
    (snapshotsOutdated && snapshotsDidUpdate
      ? chalk.bold.green(`${snapshotsOutdated} removed`) + ', '
      : '') +
    (snapshotsFilesRemoved && !snapshotsDidUpdate
      ? chalk.bold.yellow(
          pluralize('file', snapshotsFilesRemoved) + ' obsolete'
        ) + ', '
      : '') +
    (snapshotsFilesRemoved && snapshotsDidUpdate
      ? chalk.bold.green(
          pluralize('file', snapshotsFilesRemoved) + ' removed'
        ) + ', '
      : '') +
    (snapshotsUpdated
      ? chalk.bold.green(`${snapshotsUpdated} updated`) + ', '
      : '') +
    (snapshotsAdded
      ? chalk.bold.green(`${snapshotsAdded} written`) + ', '
      : '') +
    (snapshotsPassed
      ? chalk.bold.green(`${snapshotsPassed} passed`) + ', '
      : '') +
    `${snapshotsTotal} total`;

  const time = renderTime(runTime, estimatedTime, width);
  return [suites, tests, snapshots, time].join('\n');
};
