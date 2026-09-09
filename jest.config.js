module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": "@swc/jest",
  },
  prettierPath: require.resolve('prettier-2'),
};
