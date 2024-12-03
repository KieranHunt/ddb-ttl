#!/usr/bin/env -S npx tsx
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DdbTtlStack } from "../lib/ddb-ttl-stack";

const app = new cdk.App();
new DdbTtlStack(app, "DdbTtlStack", {});
