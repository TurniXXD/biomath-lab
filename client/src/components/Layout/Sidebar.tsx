"use client";

import React, { useMemo, useState } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Box,
  Avatar,
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
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
} from "@chakra-ui/react";
import {
  Sigma,
  Dna,
  Film,
  ChevronLeft,
  ChevronRight,
  Orbit,
  GitBranch,
  Sparkles,
  DnaOff,
  Activity,
  Newspaper,
} from "lucide-react";
import { animationSectionAnchors } from "@/components/Animations/animationSections";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
};

type FlyoutItem = {
  id: string;
  title: string;
  href: string;
};

const linearAlgebraList: FlyoutItem[] = [
  { id: "vectors", title: "Vectors", href: "/vectors" },
  { id: "matrix", title: "Matrix transformations", href: "/matrix" },
  { id: "pca", title: "PCA", href: "/pca" },
  { id: "svd", title: "SVD", href: "/svd" },
];

const phylogeneticsList: FlyoutItem[] = [
  { id: "builder", title: "Tree Builder", href: "/phylogenetic-trees" },
  { id: "pam", title: "PAM", href: "/phylogenetic-trees/pam" },
  { id: "blosum", title: "BLOSUM", href: "/phylogenetic-trees/blosum" },
];

const metabolismList: FlyoutItem[] = [
  { id: "simulator", title: "Simulator", href: "/metabolism" },
  { id: "reactome", title: "Reactome", href: "/metabolism/reactome" },
  { id: "kegg", title: "KEGG", href: "/metabolism/kegg" },
  { id: "biocyc", title: "BioCyc", href: "/metabolism/biocyc" },
  { id: "ecocyc", title: "EcoCyc", href: "/metabolism/ecocyc" },
];

const Sidebar = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { data: session, status } = useSession();

  const topNavItems = useMemo<NavItem[]>(() => {
    return [
      { label: "Linear Algebra", href: "/vectors", icon: Sigma },
      { label: "Publications", href: "/publications", icon: Newspaper },
      { label: "Animations", href: "/animations", icon: Film },
    ];
  }, []);

  const sequenceNavItems = useMemo<NavItem[]>(() => {
    return [
      { label: "BLAST", href: "/blast", icon: Dna },
      { label: "Alignment", href: "/alignment", icon: GitBranch },
      { label: "AlphaFold", href: "/alphafold", icon: Sparkles },
      { label: "Evo 2 visualizer", href: "/evo2-visualizer", icon: DnaOff },
      { label: "PDB Viewer", href: "/pdb", icon: Orbit },
      { label: "Phylogenetic trees", href: "/phylogenetic-trees", icon: GitBranch },
      { label: "Metabolism", href: "/metabolism", icon: Activity },
    ];
  }, []);

  const width = collapsed ? "72px" : "240px";

  const renderNavItem = (item: NavItem) => {
    const isLinearAlgebra = item.label === "Linear Algebra";
    const isAnimations = item.label === "Animations";
    const linearAlgebraActive = linearAlgebraList.some(({ href }) => {
      return pathname === href || pathname.startsWith(`${href}/`);
    });
    const active = isLinearAlgebra ? linearAlgebraActive : pathname === item.href;
    const isPhylogenetics = item.href === "/phylogenetic-trees";
    const isMetabolism = item.href === "/metabolism";
    const animationActive =
      pathname === "/animations" || pathname.startsWith("/animations/");
    const metabolismActive = metabolismList.some(({ href }) => {
      return pathname === href || pathname.startsWith(`${href}/`);
    });
    const finalActive = isLinearAlgebra
      ? linearAlgebraActive
      : isAnimations
        ? animationActive
        : isMetabolism
          ? metabolismActive
          : active;
    const hasFlyout =
      isLinearAlgebra || isAnimations || isPhylogenetics || isMetabolism;

    const NavLink = (
      <Link
        as={NextLink}
        href={item.href}
        prefetch={false}
        w="100%"
        p={2}
        borderRadius="md"
        bg={finalActive ? "yellow.400" : "transparent"}
        color={finalActive ? "black" : "white"}
        _hover={{ bg: finalActive ? "yellow.400" : "whiteAlpha.200" }}
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

    if (!hasFlyout) {
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

    const popoverTitle = isLinearAlgebra
      ? "Linear Algebra"
      : isAnimations
        ? "Animations"
        : isMetabolism
          ? "Metabolism"
          : "Phylogenetic Trees";
    const flyoutItems = isLinearAlgebra
      ? linearAlgebraList
      : isAnimations
        ? animationSectionAnchors
        : isMetabolism
          ? metabolismList
          : phylogeneticsList;

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
              {popoverTitle}
            </PopoverHeader>

            <PopoverBody p={2}>
              <VStack align="stretch" spacing={1}>
                {flyoutItems.map((a) => {
                  const isActive =
                    pathname === a.href ||
                    pathname.startsWith(`${a.href}/`);

                  return (
                    <Link
                      key={a.id}
                      as={NextLink}
                      href={a.href}
                      prefetch={false}
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
  };

  return (
    <Box
      w={width}
      bg="gray.900"
      color="white"
      p={4}
      display={{ base: "none", md: "flex" }}
      flexDirection="column"
      transition="width 0.2s ease"
      borderRightWidth="1px"
      borderRightColor="whiteAlpha.200"
      h="100vh"
      overflowY="auto"
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
        {topNavItems.map(renderNavItem)}

        <Divider borderColor="whiteAlpha.200" />

        {!collapsed ? (
          <Text fontSize="xs" fontWeight="700" letterSpacing="0.12em" color="whiteAlpha.600">
            DNA, protein, metabolism
          </Text>
        ) : null}

        {sequenceNavItems.map(renderNavItem)}
      </VStack>

      <Box
        mt="auto"
        pt={4}
        borderTopWidth="1px"
        borderTopColor="whiteAlpha.200"
      >
        {status === "authenticated" && session?.user ? (
          <Menu placement="right-end" offset={[0, 12]}>
            <MenuButton
              w="100%"
              p={2}
              borderRadius="lg"
              _hover={{ bg: "whiteAlpha.100" }}
            >
              <HStack spacing={3} align="center">
                <Avatar
                  size="sm"
                  name={session.user.name ?? session.user.email ?? "User"}
                  src={session.user.image ?? undefined}
                  bg="orange.400"
                  color="black"
                />
                <Box
                  overflow="hidden"
                  whiteSpace="nowrap"
                  opacity={collapsed ? 0 : 1}
                  transition="opacity 0.15s ease"
                  flex="1"
                  textAlign="left"
                >
                  <Text fontSize="sm" fontWeight="semibold" lineHeight="1.2">
                    {session.user.name ?? "Signed in"}
                  </Text>
                  <Text fontSize="xs" opacity={0.7} lineHeight="1.2">
                    {session.user.email}
                  </Text>
                </Box>
              </HStack>
            </MenuButton>

            <Portal>
              <MenuList
                bg="gray.800"
                borderColor="whiteAlpha.200"
                color="white"
                zIndex={2000}
              >
                <MenuItem
                  bg="transparent"
                  _hover={{ bg: "whiteAlpha.100" }}
                  _focus={{ bg: "whiteAlpha.100" }}
                  isDisabled
                >
                  {session.user.email}
                </MenuItem>
                <MenuDivider borderColor="whiteAlpha.200" />
                <MenuItem
                  bg="transparent"
                  _hover={{ bg: "red.500" }}
                  _focus={{ bg: "red.500" }}
                  onClick={() => {
                    void signOut({ callbackUrl: "/login" });
                  }}
                >
                  Log out
                </MenuItem>
              </MenuList>
            </Portal>
          </Menu>
        ) : (
          <Box
            px={2}
            py={3}
            color="whiteAlpha.700"
            fontSize="sm"
            opacity={collapsed ? 0 : 1}
            transition="opacity 0.15s ease"
          >
            {status === "loading" ? "Loading user..." : "Not signed in"}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Sidebar;
