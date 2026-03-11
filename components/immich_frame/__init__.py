import os

import esphome.codegen as cg
import esphome.config_validation as cv

CODEOWNERS = ["@jtenniswood"]

CONFIG_SCHEMA = cv.Schema({})


async def to_code(config):
    component_dir = os.path.dirname(os.path.abspath(__file__))
    cg.add_build_flag(f"-I{component_dir}")
    # The // neutralizes the trailing semicolon that add_global appends
    cg.add_global(cg.RawExpression('#include "immich_helpers.h" //'))
