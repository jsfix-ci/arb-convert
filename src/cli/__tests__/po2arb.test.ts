/* eslint-disable global-require */
import fs from 'fs';
import tempy from 'tempy';

mockDateNow();

const sourceArb = fs.readFileSync('src/cli/__tests__/source.arb').toString();
const targetArb = fs.readFileSync('src/cli/__tests__/target_output.arb').toString();

describe('po2arb cli tool', () => {
  let exitSpy: jest.SpyInstance;
  let stdoutSpy: jest.SpyInstance;
  let helpSpy: jest.SpyInstance;

  beforeAll(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit() was called');
    });
    stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
  });

  beforeEach(() => {
    // Make require() call work in all tests
    jest.resetModules();

    exitSpy.mockClear();
    stdoutSpy.mockClear();

    const { Command } = require('commander');
    helpSpy = jest.spyOn(Command.prototype, 'outputHelp').mockImplementation();
  });

  test('missing args', () => {
    process.argv = ['node', 'po2arb.js'];
    expect(() => require('../po2arb')).toThrow('process.exit() was called');
    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(helpSpy).toHaveBeenCalled();
  });

  test('missing --file arg', () => {
    process.argv = [
      'node', 'po2arb.js',
      '--sourceout', 'foo',
    ];
    expect(() => require('../po2arb')).toThrow('process.exit() was called');
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(stdoutSpy).toHaveBeenCalledWith("error: option '--file <filename>' is required");
    expect(helpSpy).not.toHaveBeenCalled();
  });

  test('with --file arg to stdout', () => {
    process.argv = [
      'node', 'po2arb.js',
      '--file', 'src/cli/__tests__/only_source.po',
    ];
    expect(() => require('../po2arb')).not.toThrow();
    expect(exitSpy).not.toHaveBeenCalled();
    expect(stdoutSpy).toHaveBeenCalledWith(sourceArb);
    expect(helpSpy).not.toHaveBeenCalled();
  });

  test('with --file arg to file', () => {
    const sourceOutPath = tempy.file({ extension: 'arb' });
    process.argv = [
      'node', 'po2arb.js',
      '--file', 'src/cli/__tests__/only_source.po',
      '--sourceout', sourceOutPath,
    ];
    expect(() => require('../po2arb')).not.toThrow();

    expect(exitSpy).not.toHaveBeenCalled();
    expect(stdoutSpy).not.toHaveBeenCalled();
    expect(helpSpy).not.toHaveBeenCalled();
    expect(fs.readFileSync(sourceOutPath).toString()).toBe(sourceArb);
  });

  test('with --sourceout and --targetout args', () => {
    const sourceOutPath = tempy.file({ extension: 'arb' });
    const targetOutPath = tempy.file({ extension: 'arb' });
    process.argv = [
      'node', 'po2arb.js',
      '--file', 'src/cli/__tests__/with_target.po',
      '--sourceout', sourceOutPath,
      '--targetout', targetOutPath,
    ];
    expect(() => require('../po2arb')).not.toThrow();

    expect(exitSpy).not.toHaveBeenCalled();
    expect(stdoutSpy).not.toHaveBeenCalled();
    expect(helpSpy).not.toHaveBeenCalled();
    expect(fs.readFileSync(sourceOutPath).toString()).toBe(sourceArb);
    expect(fs.readFileSync(targetOutPath).toString()).toBe(targetArb);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
});
