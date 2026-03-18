"use client";

import React, { useMemo, useState } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  VStack,
  Link,
  Text,
  HStack,
  Icon,
  IconButton,
  Tooltip,
  Divider,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  PopoverHeader,
  Portal,
} from "@chakra-ui/react";
import {
  Sigma,
  ScatterChart,
  SquareStack,
  Dna,
  Film,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Orbit,
} from "lucide-react";
import { animationList } from "@/components/Animations/animationtsRegistry";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
};

const Sidebar = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = useMemo<NavItem[]>(() => {
    return [
      { label: "Vectors", href: "/vectors", icon: TrendingUp },
      { label: "Matrix transformations", href: "/matrix", icon: Sigma },
      { label: "PCA", href: "/pca", icon: ScatterChart },
      { label: "SVD", href: "/svd", icon: SquareStack },
      { label: "BLAST", href: "/blast", icon: Dna },
      { label: "PDB Viewer", href: "/pdb", icon: Orbit },
      { label: "Animations", href: "/animations", icon: Film },
    ];
  }, []);

  const width = collapsed ? "72px" : "240px";

  return (
    <Box
      w={width}
      bg="gray.900"
      color="white"
      p={4}
      display={{ base: "none", md: "block" }}
      transition="width 0.2s ease"
      borderRightWidth="1px"
      borderRightColor="whiteAlpha.200"
      minH="100vh"
      position="sticky"
      top="0"
      zIndex={10}
    >
      <HStack justify="space-between" align="center" mb={4}>
        <Box overflow="hidden" whiteSpace="nowrap">
          <Text
            fontSize="lg"
            fontWeight="bold"
            opacity={collapsed ? 0 : 1}
            transition="opacity 0.15s ease"
          >
            BioMath Lab
          </Text>
        </Box>

        <IconButton
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          icon={
            <Icon as={collapsed ? ChevronRight : ChevronLeft} boxSize={5} />
          }
          size="sm"
          variant="ghost"
          color="white"
          _hover={{ bg: "whiteAlpha.200" }}
          onClick={() => {
            setCollapsed((v) => !v);
          }}
        />
      </HStack>

      <Divider borderColor="whiteAlpha.200" mb={4} />

      <VStack align="stretch" spacing={2}>
        {navItems.map((item) => {
          const active = pathname === item.href;
          const isAnimations = item.href === "/animations";

          const NavLink = (
            <Link
              as={NextLink}
              href={item.href}
              w="100%"
              p={2}
              borderRadius="md"
              bg={active ? "yellow.400" : "transparent"}
              color={active ? "black" : "white"}
              _hover={{ bg: active ? "yellow.400" : "whiteAlpha.200" }}
              display="flex"
              alignItems="center"
              gap={3}
            >
              <Icon as={item.icon} boxSize={5} />
              <Box
                overflow="hidden"
                whiteSpace="nowrap"
                opacity={collapsed ? 0 : 1}
                transition="opacity 0.15s ease"
                flex="1"
              >
                {item.label}
              </Box>
            </Link>
          );

          if (!isAnimations) {
            return (
              <Tooltip
                key={item.href}
                label={collapsed ? item.label : ""}
                placement="right"
                isDisabled={!collapsed}
                openDelay={200}
              >
                {NavLink}
              </Tooltip>
            );
          }

          // ✅ Animations flyout
          return (
            <Popover
              key={item.href}
              trigger="hover"
              placement="left-start"
              openDelay={150}
              closeDelay={150}
              gutter={12}
              isLazy
            >
              <Tooltip
                label={collapsed ? item.label : ""}
                placement="right"
                isDisabled={!collapsed}
                openDelay={200}
              >
                <Box>
                  <PopoverTrigger>
                    {/* PopoverTrigger needs a single element */}
                    <Box>{NavLink}</Box>
                  </PopoverTrigger>
                </Box>
              </Tooltip>

              <Portal>
                <PopoverContent
                  bg="gray.800"
                  borderColor="whiteAlpha.200"
                  color="white"
                  borderRadius="lg"
                  boxShadow="lg"
                  w="260px"
                  _focus={{ boxShadow: "lg" }}
                  zIndex={2000}
                >
                  <PopoverArrow bg="gray.800" />
                  <PopoverHeader borderColor="whiteAlpha.200" fontWeight="bold">
                    Animations
                  </PopoverHeader>

                  <PopoverBody p={2}>
                    <VStack align="stretch" spacing={1}>
                      {animationList.map((a) => {
                        const isActive =
                          pathname === a.href ||
                          pathname.startsWith(`${a.href}/`);

                        return (
                          <Link
                            key={a.id}
                            as={NextLink}
                            href={a.href}
                            px={2}
                            py={2}
                            borderRadius="md"
                            bg={isActive ? "yellow.400" : "transparent"}
                            color={isActive ? "black" : "white"}
                            _hover={{
                              bg: isActive ? "yellow.400" : "whiteAlpha.200",
                            }}
                          >
                            {a.title}
                          </Link>
                        );
                      })}
                    </VStack>
                  </PopoverBody>
                </PopoverContent>
              </Portal>
            </Popover>
          );
        })}
      </VStack>
    </Box>
  );
};

export default Sidebar;
