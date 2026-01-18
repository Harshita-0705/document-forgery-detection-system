#!/usr/bin/env python3
"""
Compatibility fixes for Python 3.14 with numpy/torch
"""

import warnings
import os

# Suppress numpy warnings for Python 3.14 compatibility
warnings.filterwarnings("ignore", category=RuntimeWarning, module="numpy")
warnings.filterwarnings("ignore", message=".*MINGW-W64.*")
warnings.filterwarnings("ignore", message=".*invalid value encountered.*")

# Set environment variables to reduce numpy warnings
os.environ['PYTHONWARNINGS'] = 'ignore::RuntimeWarning'


def suppress_numpy_warnings():
    """Suppress numpy compatibility warnings if numpy is available"""
    try:
        import numpy as np
    except ImportError:
        # If numpy is not installed yet, skip patching so startup continues
        return None

    original_seterr = np.seterr
    np.seterr(all='ignore')
    return original_seterr


def init_compatibility():
    """Initialize compatibility fixes"""
    suppress_numpy_warnings()
    print("Compatibility fixes applied")