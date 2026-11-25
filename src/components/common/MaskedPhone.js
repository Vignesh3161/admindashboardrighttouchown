import React, { useState } from "react";
import PropTypes from "prop-types";
import { HStack, Text, IconButton, Tooltip } from "@chakra-ui/react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

/**
 * MaskedPhone Component
 * Formats phone number as 98••••1618 with an eye toggle to reveal or hide.
 */
export default function MaskedPhone({ phone, ...rest }) {
  const [revealed, setRevealed] = useState(false);

  if (!phone) return <Text as="span" color="gray.400">—</Text>;

  const str = String(phone).trim();
  const masked =
    str.length >= 8
      ? `${str.slice(0, 2)}••••${str.slice(-4)}`
      : str;

  return (
    <HStack spacing={1.5} as="span" display="inline-flex" align="center" {...rest}>
      <Text as="span" fontSize="xs" fontFamily="mono">
        {revealed ? str : masked}
      </Text>
      <Tooltip label={revealed ? "Hide number" : "Reveal number"} fontSize="2xs" hasArrow>
        <IconButton
          aria-label={revealed ? "Hide phone" : "Reveal phone"}
          icon={revealed ? <FaEyeSlash size={10} /> : <FaEye size={10} />}
          size="xs"
          h="16px"
          w="16px"
          minW="16px"
          variant="ghost"
          color="gray.400"
          _hover={{ color: "#0F766E" }}
          onClick={(e) => {
            e.stopPropagation();
            setRevealed((prev) => !prev);
          }}
        />
      </Tooltip>
    </HStack>
  );
}

MaskedPhone.propTypes = {
  phone: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
