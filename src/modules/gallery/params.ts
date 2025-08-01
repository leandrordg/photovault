import {
  createLoader,
  parseAsBoolean,
  parseAsInteger,
  parseAsStringEnum,
} from "nuqs/server";

export const filtersSearchParams = {
  limit: parseAsInteger.withDefault(50).withOptions({ clearOnDefault: true }),
  mediaType: parseAsStringEnum(["all", "image", "video"])
    .withDefault("all")
    .withOptions({ clearOnDefault: true }),
  offset: parseAsInteger.withDefault(0).withOptions({ clearOnDefault: true }),
  showFavorites: parseAsBoolean
    .withDefault(false)
    .withOptions({ clearOnDefault: true }),
};

export const loadSearchParams = createLoader(filtersSearchParams);
