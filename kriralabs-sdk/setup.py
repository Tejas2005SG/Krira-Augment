"""Setup script for the krira-augment SDK package."""

from __future__ import annotations

from pathlib import Path

from setuptools import find_packages, setup

ROOT = Path(__file__).parent
README = ROOT / "README.md"
LONG_DESCRIPTION = (
    README.read_text(encoding="utf-8") if README.exists() else "Official Python SDK for Krira Augment."
)


setup(
    name="krira-augment-sdk",
    version="1.0.1",
    description="Official Python SDK for building integrations with Krira Augment RAG pipelines",
    long_description=LONG_DESCRIPTION,
    long_description_content_type="text/markdown",
    author="Krira Labs",
    author_email="support@kriralabs.com",
    url="https://kriralabs.com",
    license="MIT",
    packages=find_packages(exclude=("tests", "tests.*", "kriralabs", "kriralabs.*")),
    python_requires=">=3.9",
    install_requires=[
        "requests>=2.31.0,<3.0.0",
        "typing-extensions>=4.0; python_version<'3.11'",
    ],
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Software Development :: Libraries :: Application Frameworks",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
    project_urls={
        "Source": "https://github.com/kriralabs/sdk",
        "Tracker": "https://github.com/kriralabs/sdk/issues",
    },
    include_package_data=True,
    zip_safe=False,
)
