import esphome.codegen as cg
import esphome.config_validation as cv

CODEOWNERS = ["@jtenniswood"]
DEPENDENCIES = ["json"]

CONFIG_SCHEMA = cv.Schema({})


async def to_code(config):
    cg.add_global(cg.RawStatement('#include "esphome/components/espframe/espframe_helpers.h"'))
